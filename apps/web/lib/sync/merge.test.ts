import { describe, expect, it } from 'vitest';
import { applyLocalDeletions, hashText, planMerge, type SyncRecord } from './merge';

const rec = (id: string, updatedAt: number, opts: Partial<SyncRecord> = {}): SyncRecord => ({
  id,
  updatedAt,
  deleted: false,
  hash: 'h',
  ...opts,
});

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

  it('breaks an exact timestamp tie by content, so two same-ms edits converge', () => {
    // Different content, same clock: exactly one side must win, and it must be deterministic.
    expect(planMerge([rec('a', 1000, { hash: 'x' })], [rec('a', 1000, { hash: 'y' })]).upload).toEqual(['a']);
    // Same content, same clock: nothing to do.
    expect(planMerge([rec('a', 1000, { hash: 'x' })], [rec('a', 1000, { hash: 'x' })]).unchanged).toEqual(['a']);
  });

  it('propagates a deletion instead of resurrecting the document', () => {
    // Deleted here, still present remotely → the deletion must be pushed, not pulled back.
    const plan = planMerge([rec('a', 2000, { deleted: true })], [rec('a', 1000)]);
    expect(plan.deleteRemote).toEqual(['a']);
    expect(plan.download).toEqual([]);
    expect(plan.upload).toEqual([]);
  });

  it('applies a remote deletion locally', () => {
    const plan = planMerge([rec('a', 1000)], [rec('a', 2000, { deleted: true })]);
    expect(plan.deleteLocal).toEqual(['a']);
    expect(plan.upload).toEqual([]);
  });

  it('does not re-upload a document deleted here before the other side ever saw it', () => {
    // Local tombstone, unknown remotely: still a deletion to push (never an upload).
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
    // Deleted remotely at 1000, but edited locally at 2000: the user's newer work wins.
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
    // Same result regardless of input order.
    expect(planMerge([...local].reverse(), [...remote].reverse())).toEqual(plan);
  });

  it('reaches a fixpoint: applying the plan then re-planning changes nothing', () => {
    const local = [rec('a', 2000), rec('b', 1000)];
    const remote = [rec('a', 1000), rec('b', 3000)];
    const first = planMerge(local, remote);
    // After transfer both sides hold the winner for each id; a second round must be a no-op.
    const settled = [rec('a', 2000), rec('b', 3000)];
    expect(planMerge(settled, settled)).toMatchObject({ upload: [], download: [], unchanged: ['a', 'b'] });
    expect(first.upload.concat(first.download).sort()).toEqual(['a', 'b']);
  });
});

describe('applyLocalDeletions', () => {
  it('removes exactly the documents the plan deletes', () => {
    const local = [rec('a', 1), rec('b', 2), rec('c', 3)];
    const plan = planMerge([rec('a', 1), rec('b', 2), rec('c', 3)], [rec('b', 9, { deleted: true })]);
    expect(applyLocalDeletions(local, plan).map((r) => r.id)).toEqual(['a', 'c']);
  });
});

describe('hashText', () => {
  it('is stable for the same input and differs for different input', () => {
    expect(hashText('{"a":1}')).toBe(hashText('{"a":1}'));
    expect(hashText('{"a":1}')).not.toBe(hashText('{"a":2}'));
  });

  it('handles the empty string without throwing', () => {
    expect(hashText('')).toBe(hashText(''));
  });
});
