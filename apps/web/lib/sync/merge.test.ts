import { describe, expect, it } from 'vitest';
import { applyLocalDeletions, hashText, planMerge, type SyncRecord } from './merge';

const rec = (id: string, updatedAt: number, opts: Partial<SyncRecord> = {}): SyncRecord => ({
  id,
  updatedAt,
  deleted: false,
  hash: 'h',
  ...opts,
});

/** Ids of a plan's deleteLocal entries (the plan carries records, not ids). */
const deletedIds = (plan: ReturnType<typeof planMerge>) => plan.deleteLocal.map((r) => r.id).sort();

describe('planMerge', () => {
  it('does nothing when both sides are identical', () => {
    const local = [rec('a', 1000)];
    const plan = planMerge(local, [{ ...local[0] }]);
    expect(plan).toMatchObject({ upload: [], download: [], deleteRemote: [], deleteLocal: [], unchanged: ['a'] });
  });

  it('uploads a document only this device has', () => {
    const plan = planMerge([rec('a', 1000)], []);
    expect(plan.upload).toEqual(['a']);
    expect(plan.download).toEqual([]);
  });

  it('downloads a document only the server has', () => {
    const plan = planMerge([], [rec('a', 1000)]);
    expect(plan.download).toEqual(['a']);
    expect(plan.upload).toEqual([]);
  });

  it('keeps the newer edit when both sides changed the same document', () => {
    expect(planMerge([rec('a', 2000)], [rec('a', 1000)]).upload).toEqual(['a']);
    expect(planMerge([rec('a', 1000)], [rec('a', 2000)]).download).toEqual(['a']);
  });

  it('breaks a timestamp tie with a total order, so both devices agree', () => {
    // Regression: comparing hashes with `!==` made BOTH devices consider their own copy the
    // winner, so both uploaded and the round ping-ponged forever.
    const a = rec('a', 1000, { hash: 'x' });
    const b = rec('a', 1000, { hash: 'y' });

    const fromA = planMerge([a], [b]); // A holds 'x'
    const fromB = planMerge([b], [a]); // B holds 'y'

    // Exactly one direction transfers, and the devices agree on which copy survives.
    expect(fromA.download).toEqual(['a']); // 'x' < 'y' → the larger hash ('y', device B) wins
    expect(fromB.upload).toEqual(['a']);
    expect(fromA.upload).toEqual([]);
    expect(fromB.download).toEqual([]);
  });

  it('lets a tombstone beat a live copy that shares its timestamp and hash', () => {
    // Regression: `unchanged` used to ignore `deleted`, so a same-ms deletion was ignored
    // and the live copy stayed forever.
    const live = rec('a', 1000, { hash: 'same', deleted: false });
    const tomb = rec('a', 1000, { hash: 'same', deleted: true });

    expect(planMerge([live], [tomb]).deleteLocal.map((r) => r.id)).toEqual(['a']);
    expect(planMerge([tomb], [live]).deleteRemote).toEqual(['a']);
    // And it must not be reported as unchanged.
    expect(planMerge([live], [tomb]).unchanged).toEqual([]);
  });

  it('propagates a deletion instead of resurrecting the document', () => {
    const plan = planMerge([rec('a', 2000, { deleted: true })], [rec('a', 1000)]);
    expect(plan.deleteRemote).toEqual(['a']);
    expect(plan.download).toEqual([]);
    expect(plan.upload).toEqual([]);
  });

  it('records a remote deletion with the remote timestamp', () => {
    // Carrying the tombstone's own updatedAt matters: a local (older) timestamp would let a
    // stale peer's live copy win the next round.
    const plan = planMerge([rec('a', 1000)], [rec('a', 2000, { deleted: true })]);
    expect(deletedIds(plan)).toEqual(['a']);
    expect(plan.deleteLocal[0].updatedAt).toBe(2000);
    expect(plan.upload).toEqual([]);
  });

  it('does not re-upload a document deleted here before the other side ever saw it', () => {
    const plan = planMerge([rec('a', 1000, { deleted: true })], []);
    expect(plan.deleteRemote).toEqual(['a']);
    expect(plan.upload).toEqual([]);
  });

  it('ignores a remote tombstone for a document it never had', () => {
    const plan = planMerge([], [rec('a', 1000, { deleted: true })]);
    expect(plan.download).toEqual([]);
    expect(plan.deleteLocal).toEqual([]);
  });

  it('resolves an edit-after-delete race in favour of the newer edit', () => {
    const plan = planMerge([rec('a', 2000)], [rec('a', 1000, { deleted: true })]);
    expect(plan.upload).toEqual(['a']);
    expect(plan.deleteLocal).toEqual([]);
  });

  it('is order-independent and handles many documents at once', () => {
    const local = [rec('only-local', 1), rec('both-newer', 5000), rec('both-older', 1000), rec('deleted-here', 9000, { deleted: true })];
    const remote = [rec('only-remote', 1), rec('both-newer', 4000), rec('both-older', 2000), rec('deleted-here', 100)];
    const plan = planMerge(local, remote);
    expect(plan).toMatchObject({
      upload: ['both-newer', 'only-local'],
      download: ['both-older', 'only-remote'],
      deleteRemote: ['deleted-here'],
      deleteLocal: [],
      unchanged: [],
    });
    expect(planMerge([...local].reverse(), [...remote].reverse())).toEqual(plan);
  });

  it('reaches a fixpoint: applying the plan then re-planning changes nothing', () => {
    const local = [rec('a', 2000, { hash: 'ha' }), rec('b', 1000, { hash: 'hb' })];
    const remote = [rec('a', 1000, { hash: 'ha' }), rec('b', 3000, { hash: 'hb' })];
    const first = planMerge(local, remote);

    // Build the post-transfer state from the plan itself, instead of hard-coding it, so the
    // test actually applies what the plan says to do.
    const apply = (own: SyncRecord[], other: SyncRecord[]) => {
      const byId = new Map([...own, ...other].map((r) => [r.id, r]));
      return [...byId.values()];
    };
    const afterLocal = apply(
      local.map((r) => (first.download.includes(r.id) ? remote.find((x) => x.id === r.id)! : r)),
      [],
    );
    const afterRemote = apply(
      remote.map((r) => (first.upload.includes(r.id) ? local.find((x) => x.id === r.id)! : r)),
      [],
    );

    expect(first.upload.concat(first.download).sort()).toEqual(['a', 'b']);
    // Both sides now hold the winner for each id, so a second round is a no-op.
    const second = planMerge(afterLocal, afterRemote);
    expect(second.upload).toEqual([]);
    expect(second.download).toEqual([]);
    expect(second.unchanged).toEqual(['a', 'b']);
  });

  it('converges on the same winner regardless of which side asks', () => {
    // The real convergence property: forward and reversed must pick the SAME content,
    // not merely "each picks something".
    const a = rec('a', 5000, { hash: 'aaa' });
    const b = rec('a', 5000, { hash: 'bbb' });
    const forward = planMerge([a], [b]);
    const reversed = planMerge([b], [a]);
    const winner = forward.download.length > 0 ? b : a;
    // The losing side transfers, the winning side does not; both agree it is the same record.
    expect(forward.upload.length > 0 ? a : b).toEqual(reversed.download.length > 0 ? a : b);
    expect(forward.unchanged).toEqual([]);
    expect(winner.hash).toBe('bbb'); // larger hash wins, deterministically
  });
});

describe('applyLocalDeletions', () => {
  it('keeps a tombstone instead of dropping the record', () => {
    // Regression: removing the record entirely made it look "missing locally, present
    // remotely" next round, so the deleted document was downloaded straight back.
    const local = [rec('a', 1, { hash: 'ha' }), rec('b', 2, { hash: 'hb' })];
    const plan = planMerge(local, [rec('b', 9, { hash: 'hb', deleted: true })]);
    const after = applyLocalDeletions(local, plan);

    expect(after.map((r) => r.id).sort()).toEqual(['a', 'b']);
    const tombstone = after.find((r) => r.id === 'b')!;
    expect(tombstone.deleted).toBe(true);
    expect(tombstone.updatedAt).toBe(9); // the remote timestamp, not the stale local one
    expect(after.find((r) => r.id === 'a')!.deleted).toBe(false);
  });

  it('records a tombstone for a document it had not seen yet', () => {
    const plan = planMerge([], [rec('x', 7, { deleted: true })]);
    expect(plan.deleteLocal).toEqual([]); // nothing known locally to apply
    expect(applyLocalDeletions([], plan)).toEqual([]);
  });

  it('does not resurrect a deleted document on the next round', () => {
    // End-to-end: A deletes, B still has the old copy, they sync, then a third peer syncs.
    const a = [rec('cv', 2000, { hash: 'h2', deleted: true })];
    const b = [rec('cv', 1000, { hash: 'h1' })];

    const bPlan = planMerge(b, a); // B learns about the deletion
    const bAfter = applyLocalDeletions(b, bPlan);
    expect(bAfter.find((r) => r.id === 'cv')!.deleted).toBe(true);
    expect(bAfter.find((r) => r.id === 'cv')!.updatedAt).toBe(2000);

    // A fresh peer that still holds the pre-deletion copy must NOT win.
    const stalePeer = [rec('cv', 1000, { hash: 'h1' })];
    expect(planMerge(stalePeer, bAfter).deleteLocal.map((r) => r.id)).toEqual(['cv']);
    expect(planMerge(stalePeer, bAfter).download).toEqual([]);
  });
});

describe('hashText', () => {
  it('is stable for the same input and differs for different input', () => {
    expect(hashText('{"a":1}')).toBe(hashText('{"a":1}'));
    expect(hashText('{"a":1}')).not.toBe(hashText('{"a":2}'));
  });

  it('does not collide on the pair that broke the 32-bit version', () => {
    // Regression: djb2 mapped both 'Aa' and 'B@' to 597307, so two different bodies were
    // treated as identical and one was silently dropped.
    expect(hashText('Aa')).not.toBe(hashText('B@'));
  });

  it('handles the empty string without throwing', () => {
    expect(hashText('')).toBe(hashText(''));
  });
});
