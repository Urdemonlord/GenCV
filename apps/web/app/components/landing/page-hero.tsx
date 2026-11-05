import type { ReactNode } from 'react';

/**
 * Hero halaman konten Ayo Kerja — bahasa yang sama dengan hero portal
 * /lowongan dan Beranda (latar kuning, eyebrow biru dengan kotak kecil,
 * headline display, lead navy), tapi tanpa search dan tanpa art, supaya
 * halaman konten (templates, artikel, profil, ...) punya pembuka yang sama
 * tanpa meniru hero portal satu per satu.
 *
 * `size="display"` (huruf kapital, skala portal) hanya untuk halaman yang
 * memang bergaya portal dan memakai `art`; halaman konten memakai
 * `size="standard"` supaya judul panjang tetap enak dibaca dan nama
 * aksesibel h1 tidak berubah (mis. "CV saya" di dashboard).
 * `top` untuk tautan kembali yang diletakkan di atas eyebrow (artikel).
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  art,
  size = 'standard',
  top,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  art?: ReactNode;
  size?: 'display' | 'standard';
  top?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="bg-brand-accent text-foreground">
      <div className="mx-auto max-w-[1440px] px-4 py-8 lg:py-10">
        <div className={art ? 'grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]' : undefined}>
          <div>
            {top}
            <p className="flex items-center gap-2.5 text-[13px] font-black uppercase tracking-[0.045em] text-primary">
              <span aria-hidden="true" className="inline-block size-2.5 rounded-[3px] bg-primary" />
              {eyebrow}
            </p>
            <h1
              className={
                size === 'display'
                  ? 'mt-4 max-w-[760px] text-[clamp(2.5rem,4.5vw,4.35rem)] font-black uppercase leading-[0.98] tracking-[-0.06em]'
                  : 'mt-4 max-w-[760px] text-[clamp(2rem,3.5vw,3rem)] font-black leading-[1.05] tracking-[-0.03em]'
              }
            >
              {title}
            </h1>
            {lead ? (
              <p className="mt-4 max-w-[620px] text-base font-medium leading-[1.55] text-[#10265A]">{lead}</p>
            ) : null}
            {children}
          </div>
          {art}
        </div>
      </div>
    </section>
  );
}
