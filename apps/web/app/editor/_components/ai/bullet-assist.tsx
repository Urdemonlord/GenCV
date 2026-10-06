'use client';

import { useState } from 'react';
import type { BulletSection } from '@/lib/ai/suggestions';
import { AiButton, type SectionProps } from '../sections/shared';
import { aiErrorMessage, requestBulletSuggestions, SuggestionList, useSuggestions } from './suggestions';

/** "Perbaiki dengan AI" for one entry: suggestions per bullet, applied only when accepted. */
export function BulletAssist({ cv, update, section, itemId, hint }: SectionProps & { section: BulletSection; itemId: string; hint: string }) {
  const suggestions = useSuggestions(update);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const item = cv[section].find((i) => i.id === itemId);
  const hasBullets = Boolean(item?.bullets.some((b) => b.trim()));

  const run = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const found = await requestBulletSuggestions(cv, section, itemId);
      suggestions.add(found);
      if (found.length === 0) setMessage({ text: 'Poin-poin ini sudah cukup kuat; AI tidak punya saran.', error: false });
    } catch (error) {
      setMessage({ text: aiErrorMessage(error), error: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <AiButton busy={busy} disabled={!hasBullets} onClick={run}>
          Perbaiki dengan AI
        </AiButton>
        <span className="text-xs text-muted-foreground">{hasBullets ? hint : 'Tulis poinnya dulu; AI hanya merapikan, tidak mengarang.'}</span>
      </div>
      {message && (
        <p className={message.error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'} role={message.error ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}
      <SuggestionList cv={cv} suggestions={suggestions.items} onAccept={suggestions.accept} onReject={suggestions.dismiss} />
    </>
  );
}
