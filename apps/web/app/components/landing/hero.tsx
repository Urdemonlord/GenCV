import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowRight, CheckCircle2, FileText, Share2, Sparkles } from 'lucide-react';
import { Button, Chip, ProgressBar, ScoreRing } from '@/components/ds';
import { analyzeCv, scoreLabel } from '@/lib/cv/analysis/analyze';
import { matchKeywords } from '@/lib/cv/analysis/keywords';
import { SAMPLE_CV, SAMPLE_JOB_AD } from '@/lib/sample-cv';

const POINTS = ['Gratis untuk memulai', 'Template ramah ATS', 'Analisis ATS & Job Match', 'Ekspor PDF & DOCX'];

export function Hero() {
  // Real engine output on the sample CV: the landing page shows what the product computes.
  const analysis = analyzeCv(SAMPLE_CV);
  const match = matchKeywords(SAMPLE_CV, SAMPLE_JOB_AD);

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 size-[640px] rounded-full bg-brand-accent/15 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-brand-accent-soft" aria-hidden="true" />
            Workspace CV dengan bantuan AI
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Buat CV profesional yang ramah ATS, <span className="text-gradient">dalam hitungan menit.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            GenCV membantu fresh graduate dan profesional menulis CV yang relevan dengan lowongan yang diincar: template
            siap pakai, analisis ATS yang bisa dijelaskan, dan saran AI yang tidak mengarang angka.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="primary" size="lg">
              <Link href="/editor">
                Mulai buat CV gratis
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/templates">Lihat template</Link>
            </Button>
          </div>
          <ul className="mt-8 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary-soft" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-lg" aria-label="Contoh hasil GenCV" role="group">
          <div className="rotate-1 overflow-hidden rounded-lg shadow-2xl shadow-black/50 ring-1 ring-white/10">
            <Image
              src="/previews/professional.webp"
              alt="Contoh CV Arya Pratama, Software Engineer, dengan template Professional"
              width={893}
              height={1263}
              priority
              className="h-auto w-full"
            />
          </div>

          <div className="absolute -left-6 top-10 hidden w-56 rounded-xl border border-border bg-surface/95 p-4 shadow-xl backdrop-blur sm:block">
            <p className="text-xs font-semibold text-muted-foreground">Skor kesiapan ATS · contoh</p>
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

          <div className="absolute -right-4 bottom-24 hidden w-60 rounded-xl border border-border bg-surface/95 p-4 shadow-xl backdrop-blur sm:block">
            <p className="text-xs font-semibold text-muted-foreground">Job Match · Backend Engineer</p>
            <p className="mt-1 text-lg font-bold text-foreground">{match.score}% cocok</p>
            <ProgressBar className="mt-2" value={match.score ?? 0} label="Kecocokan keyword contoh" tone="success" />
            <div className="mt-3 flex flex-wrap gap-1">
              {match.matched.slice(0, 3).map((k) => (
                <Chip key={k} tone="success">
                  ✓ {k}
                </Chip>
              ))}
              {match.missing.slice(0, 2).map((k) => (
                <Chip key={k} tone="danger">
                  {k}
                </Chip>
              ))}
            </div>
          </div>

          <div className="absolute -bottom-6 left-6 hidden items-center gap-3 rounded-xl border border-border bg-surface/95 px-4 py-3 shadow-xl backdrop-blur sm:flex">
            <span className="text-xs font-semibold text-muted-foreground">Ekspor</span>
            {[
              { icon: FileText, label: 'PDF' },
              { icon: FileText, label: 'DOCX' },
              { icon: Share2, label: 'Bagikan' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1 text-xs text-foreground">
                <Icon className="size-3.5 text-primary-soft" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <a href="#fitur" className="mx-auto mb-6 hidden w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:flex">
        Lihat cara kerjanya <ArrowDown className="size-4" aria-hidden="true" />
      </a>
    </section>
  );
}
