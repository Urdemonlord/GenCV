import { ArrowRight, Gauge, LayoutPanelLeft, Sparkles, Target } from 'lucide-react';
import { Chip, Panel } from '@/components/ds';
import { analyzeCv } from '@/lib/cv/analysis/analyze';
import { SAMPLE_CV } from '@/lib/sample-cv';

export function Features() {
  const content = analyzeCv(SAMPLE_CV).components.find((c) => c.id === 'content');

  return (
    <section id="fitur" className="scroll-mt-20 border-t border-border/60 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-soft">Dibuat untuk diterima kerja</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          Bukan sekadar generator. Workspace untuk menyusun, menguji, dan menyesuaikan CV.
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Panel className="p-6">
            <LayoutPanelLeft className="size-6 text-primary-soft" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold">Editor dengan pratinjau PDF asli</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Isi per bagian, lihat hasilnya langsung. Yang tampil di pratinjau adalah file PDF yang sama persis dengan
              yang kamu unduh, termasuk jumlah halaman. Data tersimpan di perangkatmu.
            </p>
          </Panel>

          <Panel className="p-6">
            <Gauge className="size-6 text-primary-soft" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold">Analisis ATS yang bisa dijelaskan</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Skor dihitung dari aturan yang terlihat: kelengkapan, format, keterbacaan, dan kualitas poin. Setiap
              temuan disertai saran perbaikan, misalnya:
            </p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {(content?.findings ?? []).slice(0, 2).map((f) => (
                <li key={f.message} className="rounded-lg bg-surface-raised px-3 py-2 text-foreground/90">
                  {f.message}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="p-6">
            <Target className="size-6 text-primary-soft" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold">Job Match per lowongan</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tempel deskripsi lowongan, lihat keyword keahlian yang sudah dan belum ada di CV. Satu CV bisa diduplikasi
              untuk tiap lowongan.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Chip tone="success">✓ golang</Chip>
              <Chip tone="success">✓ postgresql</Chip>
              <Chip tone="danger">kubernetes</Chip>
            </div>
          </Panel>

          <Panel className="p-6">
            <Sparkles className="size-6 text-brand-accent-soft" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold">Asisten AI yang tidak mengarang</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              AI merapikan kalimat jadi poin pencapaian yang kuat. Kalau angka bisa memperkuat, AI memberi tempat kosong
              untuk kamu isi, bukan angka karangan.
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <p className="rounded-lg bg-surface-raised px-3 py-2 text-muted-foreground">
                <span className="text-xs font-semibold uppercase">Sebelum</span>
                <br />
                Developed a web application for internal use.
              </p>
              <ArrowRight className="mx-auto size-4 rotate-90 text-muted-foreground" aria-hidden="true" />
              <p className="rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-foreground">
                <span className="text-xs font-semibold uppercase text-brand-accent-soft">Sesudah</span>
                <br />
                Built and deployed an internal web application used by <mark className="rounded bg-warning/20 px-1 text-warning">[jumlah]</mark>{' '}
                employees, reducing <mark className="rounded bg-warning/20 px-1 text-warning">[proses]</mark> time by{' '}
                <mark className="rounded bg-warning/20 px-1 text-warning">[X%]</mark>.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}
