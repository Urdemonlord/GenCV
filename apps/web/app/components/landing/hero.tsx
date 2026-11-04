import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BarChart3, Briefcase, CheckCircle2, FileText } from 'lucide-react';
import { Button, Chip, ProgressBar, ScoreRing } from '@/components/ds';
import { analyzeCv, scoreLabel } from '@/lib/cv/analysis/analyze';
import { matchKeywords } from '@/lib/cv/analysis/keywords';
import { SAMPLE_CV, SAMPLE_JOB_AD } from '@/lib/sample-cv';

const CHECKS = ['Template profesional', 'Analisis ATS', 'Job match', 'Career insight'];

const CARDS = [
  {
    href: '/editor',
    icon: FileText,
    iconClass: 'text-brand-accent',
    borderClass: 'border-t-primary',
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
    borderClass: 'border-t-primary',
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
    <section className="relative overflow-hidden bg-brand-accent text-foreground">
      {/* Ayo Kerja decorations: starburst burst + megaphone. Purely decorative. */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 hidden size-40 rotate-12 text-primary lg:block">
        <svg viewBox="0 0 100 100" className="size-full">
          <polygon points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35" fill="currentColor" />
        </svg>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute bottom-10 right-10 hidden text-6xl lg:block">📣</div>
      <div aria-hidden="true" className="pointer-events-none absolute right-[28%] top-24 hidden rotate-[-8deg] rounded-md bg-primary px-3 py-1 text-xs font-bold text-white lg:block">design</div>
      <div aria-hidden="true" className="pointer-events-none absolute right-[12%] top-40 hidden rotate-[6deg] rounded-md bg-white px-3 py-1 text-xs font-bold text-primary lg:block">portfolio</div>

      <div className="relative mx-auto max-w-6xl px-4 py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
              Workspace karier dengan AI
            </p>
            <h1 className="mt-6 font-display text-[clamp(3.75rem,7.5vw,6.5rem)] uppercase leading-[0.92]">
              <span className="block text-foreground">Your career,</span>
              <span className="block text-primary">Intelligently</span>
              <span className="block text-foreground">Designed.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
              Buat CV profesional, temukan lowongan yang relevan, dan pahami langkah kariermu berikutnya dengan AI,
              dalam satu workspace terintegrasi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="primary" size="lg">
                <Link href="/editor">
                  Mulai buat CV gratis
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/lowongan">Jelajahi lowongan</Link>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {CHECKS.map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]" aria-label="Contoh hasil GenCV" role="group">
            {/* Magenta backing card, tilted like the mockup. */}
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
      </div>
    </section>
  );
}
