import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button, Chip } from '@/components/ds';
import { TEMPLATE_IDS, TEMPLATE_INFO, type TemplateId } from '@/lib/cv/templates';

const FEATURED: TemplateId[] = ['professional', 'tech', 'creative'];

export function TemplateCard({ id }: { id: TemplateId }) {
  return (
    <figure>
      <div className="overflow-hidden rounded-lg ring-1 ring-white/10 transition-transform hover:-translate-y-1">
        <Image src={`/previews/${id}.webp`} alt={`Contoh CV dengan template ${TEMPLATE_INFO[id].name}`} width={893} height={1263} className="h-auto w-full" />
      </div>
      <figcaption className="mt-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {TEMPLATE_INFO[id].name}
          <Chip tone="success">Ramah ATS</Chip>
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">{TEMPLATE_INFO[id].description}</span>
      </figcaption>
    </figure>
  );
}

export function TemplatesShowcase() {
  return (
    <section id="template" className="scroll-mt-20 border-t border-border/60 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Template yang tetap terbaca ATS</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Semua satu kolom dengan teks asli dan judul section standar. Gambar di bawah adalah hasil ekspor sungguhan.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/templates">Semua {TEMPLATE_IDS.length} template</Link>
          </Button>
        </div>
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {FEATURED.map((id) => (
            <li key={id}>
              <TemplateCard id={id} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const STEPS = [
  { title: 'Susun', text: 'Isi data per bagian: pengalaman sebagai poin pencapaian, pendidikan, keahlian, sertifikasi, dan bahasa.' },
  { title: 'Optimalkan', text: 'Perbaiki temuan dari Analisis ATS dan tutup keyword yang kurang lewat Job Match, sesuai yang memang kamu kuasai.' },
  { title: 'Lamar', text: 'Unduh PDF atau DOCX dengan ukuran kertas yang sesuai (A4 atau US Letter) dan kirim lamaranmu.' },
];

export function HowItWorks() {
  return (
    <section className="border-t border-border/60 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Cara kerjanya</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-border bg-surface p-6">
              <span className="text-sm font-semibold text-primary-soft">0{index + 1}</span>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: 'Apakah GenCV menjamin CV saya lolos ATS?',
    a: 'Tidak ada yang bisa menjamin itu, karena setiap perusahaan memakai ATS dan pengaturan yang berbeda. GenCV memastikan formatnya mudah dibaca mesin (satu kolom, teks asli, judul section standar) dan memberi skor estimasi beserta alasannya.',
  },
  {
    q: 'Di mana data CV saya disimpan?',
    a: 'Di browser perangkatmu sendiri; PDF dan DOCX juga dibuat di browser. Teks baru dikirim ke server saat kamu menekan tombol AI: server kami meneruskannya ke Google Gemini untuk diproses dan tidak menyimpannya.',
  },
  {
    q: 'Apakah saya wajib memakai AI?',
    a: 'Tidak. Semua bisa ditulis manual. AI hanya membantu merapikan kalimat dan tidak menambahkan angka atau pengalaman yang tidak kamu berikan.',
  },
  {
    q: 'Perlu foto di CV?',
    a: 'Untuk lamaran lokal di Indonesia foto masih umum, jadi tersedia sebagai opsi. Untuk lamaran ke Amerika Serikat, foto otomatis tidak dicantumkan.',
  },
  {
    q: 'Bahasa apa yang didukung?',
    a: 'Isi CV bisa dalam Bahasa Inggris atau Bahasa Indonesia; judul section dan format tanggal menyesuaikan.',
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-border/60 py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Pertanyaan umum</h2>
        <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-surface">
          {FAQS.map((item) => (
            <details key={item.q} className="group p-5">
              <summary className="cursor-pointer list-none font-medium text-foreground [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <span aria-hidden="true" className="text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="border-t border-border/60 py-20">
      <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-brand px-6 py-14 text-center text-white">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Siap melamar dengan CV yang lebih kuat?</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/90">Mulai gratis, tanpa daftar akun. Draf tersimpan otomatis di perangkatmu.</p>
        <Button asChild size="lg" className="mt-8 bg-white text-gray-900 hover:bg-white/90">
          <Link href="/editor">
            Buat CV sekarang
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
        <p>© {new Date().getFullYear()} GenCV</p>
        <nav aria-label="Footer">
          <ul className="flex gap-4">
            <li>
              <Link href="/editor" className="hover:text-foreground">
                Editor
              </Link>
            </li>
            <li>
              <Link href="/templates" className="hover:text-foreground">
                Template
              </Link>
            </li>
            <li>
              <Link href="/#faq" className="hover:text-foreground">
                FAQ
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
