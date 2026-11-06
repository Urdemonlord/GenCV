import Link from 'next/link';
import { ArrowRight, BarChart3, Briefcase, FileText, Search } from 'lucide-react';
import { Button, Chip, ProgressBar, ScoreRing } from '@/components/ds';
import { analyzeCv, scoreLabel } from '@/lib/cv/analysis/analyze';
import { matchKeywords } from '@/lib/cv/analysis/keywords';
import { SAMPLE_CV, SAMPLE_JOB_AD } from '@/lib/sample-cv';
import { HeroArt } from './hero-art';
import { HERO_TITLE_BAR, HERO_TITLE_DISPLAY } from './page-hero';

const CARDS = [
  {
    href: '/editor',
    icon: FileText,
    title: 'CV Workspace',
    description: 'Susun, edit, dan optimalkan CV-mu dengan bantuan AI.',
  },
  {
    href: '/lowongan',
    icon: Briefcase,
    title: 'Job Portal',
    description: 'Temukan lowongan terbaru dari berbagai sumber, sesuai profilmu.',
  },
  {
    href: '/career-intelligence',
    icon: BarChart3,
    title: 'Career Intelligence',
    description: 'Analisis kecocokan, skill gap, dan rencana pengembangan karier.',
  },
];

export function Hero() {
  // Real engine output on the sample CV: the landing page shows what the product computes,
  // never the mockup's demo numbers.
  const analysis = analyzeCv(SAMPLE_CV);
  const match = matchKeywords(SAMPLE_CV, SAMPLE_JOB_AD);
  const info = SAMPLE_CV.personalInfo;

  return (
    <>
      {/* Hero portal ala mockup Ayo Kerja — sama persis dengan hero /lowongan:
          latar kuning, eyebrow, headline dengan bar biru, art megaphone, dan
          search box yang mengarah ke /lowongan?q=. */}
      <section className="bg-brand-accent text-foreground">
        <div className="mx-auto max-w-[1440px] px-4 py-8 lg:py-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <p className="flex items-center gap-2.5 text-[13px] font-black uppercase tracking-[0.045em] text-primary">
                <span aria-hidden="true" className="inline-block size-2.5 rounded-[3px] bg-primary" />
                Portal Karier &amp; Peluang Kerja
              </p>
              <h1 className={HERO_TITLE_DISPLAY}>
                <span className="block">Temukan peluang kerja yang sesuai</span>
                <span className={HERO_TITLE_BAR}>dengan profilmu.</span>
              </h1>
              <p className="mt-4 max-w-[620px] text-base font-medium leading-[1.55] text-foreground-soft">
                Jelajahi lowongan dari berbagai sumber, dapatkan rekomendasi yang relevan, dan persiapkan CV untuk
                langkah karier berikutnya.
              </p>
            </div>
            <HeroArt />
          </div>

          {/* Search hero Beranda: submit GET ke /lowongan?q=, dibaca JobList saat mount. */}
          <form action="/lowongan" method="get" className="mt-6">
            <label className="flex min-w-0 items-center gap-2.5 rounded-[14px] border-[1.5px] border-primary bg-white py-1.5 pl-4 pr-1.5">
              <Search className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="sr-only">Cari posisi, perusahaan, atau skill</span>
              <input
                type="search"
                name="q"
                placeholder="Cari posisi, perusahaan, atau skill..."
                className="w-full min-w-0 bg-transparent px-1 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="h-11 shrink-0 rounded-[13px] bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-primary-strong"
              >
                Cari
              </button>
            </label>
          </form>
        </div>
      </section>

      {/* Konten hero lama — dipindah ke bawah hero, bukan dihapus: showcase CV
          contoh + panel ATS/Job Match + kartu navigasi. Headline, CTA, dan
          daftar cek lama diganti hero mockup di atas. */}
      <section className="mx-auto max-w-[1440px] px-4 py-16 lg:py-20">
        <div className="relative mx-auto w-full max-w-[520px]" aria-label="Contoh hasil Ayo Kerja" role="group">
          {/* Backing card kuning, miring seperti mockup. */}
          <div aria-hidden="true" className="absolute inset-x-6 bottom-0 top-8 rotate-[4deg] rounded-2xl bg-brand-accent" />
          {/* Sample CV paper, built from the real sample data (not an image). */}
          <div className="relative rotate-[2deg] rounded-xl bg-white p-5 text-foreground shadow-2xl shadow-black/50">
            <p className="text-lg font-bold leading-tight">{info.fullName}</p>
            <p className="text-xs text-muted-foreground">{info.headline}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {info.email} · {info.phone} · {info.location}
            </p>
            <p className="mt-4 text-[10px] font-bold tracking-wider text-muted-foreground">SUMMARY</p>
            <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-foreground-soft">{SAMPLE_CV.professionalSummary}</p>
            <p className="mt-4 text-[10px] font-bold tracking-wider text-muted-foreground">WORK EXPERIENCE</p>
            <ul className="mt-1 space-y-3">
              {SAMPLE_CV.experience.slice(0, 2).map((job) => (
                <li key={`${job.position}-${job.company}`}>
                  <p className="flex justify-between gap-2 text-[11px] font-semibold">
                    <span>
                      {job.position} — {job.company}
                    </span>
                    <span className="shrink-0 font-normal text-muted-foreground">
                      {job.startDate} – {job.current ? 'Present' : job.endDate}
                    </span>
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] leading-relaxed text-foreground-soft">
                    {job.bullets.slice(0, 2).map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[10px] font-bold tracking-wider text-muted-foreground">EDUCATION</p>
            {SAMPLE_CV.education.slice(0, 1).map((edu) => (
              <p key={edu.institution} className="mt-1 flex justify-between gap-2 text-[11px] text-foreground-soft">
                <span>
                  {edu.degree} · {edu.institution}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {edu.startDate} – {edu.endDate}
                </span>
              </p>
            ))}
            <p className="mt-4 text-[10px] font-bold tracking-wider text-muted-foreground">SKILLS</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {SAMPLE_CV.skills.slice(0, 5).map((skill) => (
                <span key={skill.name} className="rounded border border-border px-1.5 py-0.5 text-[10px] text-foreground-soft">
                  {skill.name}
                </span>
              ))}
            </div>
          </div>

          <div className="absolute -right-2 top-2 hidden w-52 rounded-xl border-2 border-primary bg-white p-4 shadow-[4px_4px_0_var(--color-primary)] sm:block">
            <p className="text-xs font-semibold text-muted-foreground">Skor ATS · contoh</p>
            <div className="mt-2 flex items-center gap-3">
              <ScoreRing value={analysis.overall} size={64} label="Skor kesiapan ATS contoh" />
              <span className="text-sm font-semibold text-success">{scoreLabel(analysis.overall)}</span>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {analysis.components.map((c) => (
                <li key={c.id} className="flex justify-between">
                  <span>{c.label}</span>
                  <span className="font-semibold text-foreground">{c.score}%</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="absolute -bottom-4 -right-2 hidden w-56 rounded-xl border-2 border-primary bg-white p-4 shadow-[4px_4px_0_var(--color-primary)] sm:block">
            <p className="text-xs font-semibold text-muted-foreground">Job Match · contoh</p>
            <p className="mt-1 text-lg font-bold text-foreground">{match.score ?? 0}% cocok</p>
            <ProgressBar className="mt-2" value={match.score ?? 0} label="Kecocokan keyword contoh" tone="success" />
            <div className="mt-3 flex flex-wrap gap-1">
              {match.matched.slice(0, 3).map((k) => (
                <Chip key={k} tone="success">
                  ✓ {k}
                </Chip>
              ))}
              {match.missing.slice(0, 1).map((k) => (
                <Chip key={k} tone="danger">
                  {k}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {CARDS.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border-2 border-primary bg-white p-5 shadow-[4px_4px_0_var(--color-primary)] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-primary)]"
            >
              <span className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-brand-accent text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-lg font-extrabold">{title}</span>
              </span>
              <span className="mt-3 block text-sm leading-relaxed text-foreground-soft">{description}</span>
              <span className="mt-4 flex justify-end text-primary">
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
