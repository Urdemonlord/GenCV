'use client';

import { useId, useState } from 'react';
import { ImageUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ds';

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_SIDE = 512;

/** Center-crops to a square and re-encodes as JPEG so the stored draft stays small (~50 KB). */
async function toSquareJpeg(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const size = Math.min(side, MAX_SIDE);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not supported');
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85);
}

interface PhotoInputProps {
  photo: string;
  showPhoto: boolean;
  /** Photos are discouraged for US applications. */
  disabledReason?: string;
  onChange: (patch: { photo?: string; showPhoto?: boolean }) => void;
}

export function PhotoInput({ photo, showPhoto, disabledReason, onChange }: PhotoInputProps) {
  const inputId = useId();
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    setError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) return setError('Use a JPG or PNG image.');
    if (file.size > MAX_BYTES) return setError('The image must be 2 MB or smaller.');
    try {
      onChange({ photo: await toSquareJpeg(file), showPhoto: !disabledReason });
    } catch {
      setError('This image could not be read.');
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="size-20 shrink-0 overflow-hidden rounded-full border border-border bg-surface-raised">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- local data URL
          <img src={photo} alt="Profile photo" className="size-full object-cover" />
        ) : (
          <ImageUp aria-hidden="true" className="m-auto mt-6 size-7 text-muted-foreground" />
        )}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <label htmlFor={inputId} className="cursor-pointer">
              {photo ? 'Change photo' : 'Upload photo'}
            </label>
          </Button>
          {photo && (
            <Button variant="ghost" size="sm" onClick={() => onChange({ photo: '', showPhoto: false })}>
              <Trash2 aria-hidden="true" />
              Remove
            </Button>
          )}
        </div>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png"
          className="sr-only"
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        {photo && (
          <label className="flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              checked={showPhoto && !disabledReason}
              disabled={Boolean(disabledReason)}
              onChange={(event) => onChange({ showPhoto: event.target.checked })}
            />
            Show photo on CV
          </label>
        )}
        <p className="text-xs text-muted-foreground">{disabledReason ?? 'JPG or PNG, max 2 MB. Optional; ATS ignores photos.'}</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
