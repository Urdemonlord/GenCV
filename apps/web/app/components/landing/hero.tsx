import Link from 'next/link';
import { ArrowRight, BarChart3, Briefcase, FileText, Search } from 'lucide-react';
import { Button, Chip, ProgressBar, ScoreRing } from '@/components/ds';
import { analyzeCv, scoreLabel } from '@/lib/cv/analysis/analyze';
import { matchKeywords } from '@/lib/cv/analysis/keywords';
import { SAMPLE_CV, SAMPLE_JOB_AD } from '@/lib/sample-cv';
import { HeroArt } from './hero-art';

const CARDS = [
  {
    href: '/editor',
    icon: FileText,
    iconClass: 'text-brand-accent',
    borderClass: 'border-t-[#FF00FF]',
    title: 'CV Workspace',
    description: 'Susun, edit, dan optimalkan CV-mu dengan bantuan AI.',
  },
  {
    href: '/lowongan',
    icon: Briefcase,
    iconClass: 'text-primary',
    borderClass: 'border-t-primary',
    title: 'Job Portal',
    description: 'Temukan lowongan terbaru dari berbagai sumber, sesuai profilmu.',
  },
  {
    href: '/#fitur',
    icon: BarChart3,
    iconClass: 'text-brand-accent',
    borderClass: 'border-t-[#FF00FF]',
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
              <h1 className="mt-4 max-w-[760px] text-[clamp(2.5rem,4.5vw,4.35rem)] font-black uppercase leading-[0.98] tracking-[-0.06em]">
                <span className="block">Temukan peluang kerja yang sesuai</span>
                <span className="mt-1 inline-block bg-primary px-2.5 pb-1 text-brand-accent">dengan profilmu.</span>
              </h1>
              <p className="mt-4 max-w-[620px] text-base font-medium leading-[1.55] text-[#10265A]">
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
                className="w-full min-w-0 bg-transparent px-1 py-3 text-sm text-foreground outline-none placeholder:text-[#62708D]"
              />
              <button
                type="submit"
                className="h-11 shrink-0 rounded-[13px] bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-[#002B91]"
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
      <section className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        <div className="relative mx-auto w-full max-w-[520px]" aria-label="Contoh hasil Ayo Kerja" role="group">
          {/* Backing card kuning, miring seperti mockup. */}
          <div aria-hidden="true" className="absolute inset-x-6 bottom-0 top-8 rotate-[4deg] rounded-2xl bg-brand-accent" />
          {/* Sample CV paper, built from the real sample data (not an image). */}
          <div className="relative rotate-[2deg] rounded-xl bg-white p-5 text-slate-900 shadow-2xl shadow-black/50">
            <p className="text-lg font-bold leading-tight">{info.fullName}</p>
            <p className="text-xs text-slate-500">{info.headline}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              {info.email} · {info.phone} · {info.location}
            </p>
            <p className="mt-4 text-[10px] font-bold tracking-wider text-slate-400">SUMMARY</p>
            <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-slate-600">{SAMPLE_CV.professionalSummary}</p>
            <p className="mt-4 text-[10px] font-bold tracking-wider text-slate-400">WORK EXPERIENCE</p>
            <ul className="mt-1 space-y-3">
              {SAMPLE_CV.experience.slice(0, 2).map((job) => (
                <li key={`${job.position}-${job.company}`}>
                  <p className="flex justify-between gap-2 text-[11px] font-semibold">
                    <span>
                      {job.position} — {job.company}
                    </span>
                    <span className="shrink-0 font-normal text-slate-500">
                      {job.startDate} – {job.current ? 'Present' : job.endDate}
                    </span>
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] leading-relaxed text-slate-600">
                    {job.bullets.slice(0, 2).map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[10px] font-bold tracking-wider text-slate-400">EDUCATION</p>
            {SAMPLE_CV.education.slice(0, 1).map((edu) => (
              <p key={edu.institution} className="mt-1 flex justify-between gap-2 text-[11px] text-slate-600">
                <span>
                  {edu.degree} · {edu.institution}
                </span>
                <span className="shrink-0 text-slate-500">
                  {edu.startDate} – {edu.endDate}
                </span>
              </p>
            ))}
            <p className="mt-4 text-[10px] font-bold tracking-wider text-slate-400">SKILLS</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {SAMPLE_CV.skills.slice(0, 5).map((skill) => (
                <span key={skill.name} className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">
                  {skill.name}
                </span>
              ))}
            </div>
          </div>

          <div className="absolute -right-2 top-2 hidden w-52 rounded-xl border border-border bg-surface/95 p-4 shadow-xl backdrop-blur sm:block">
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

          <div className="absolute -bottom-4 -right-2 hidden w-56 rounded-xl border border-border bg-surface/95 p-4 shadow-xl backdrop-blur sm:block">
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
          {CARDS.map(({ href, icon: Icon, iconClass, borderClass, title, description }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-2xl border border-border border-t-2 bg-surface p-5 transition-colors hover:border-primary/60 ${borderClass}`}
            >
              <span className="flex items-center gap-2">
                <Icon className={`size-5 ${iconClass}`} aria-hidden="true" />
                <span className="text-lg font-bold">{title}</span>
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">{description}</span>
              <span className="mt-4 flex justify-end text-muted-foreground">
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
