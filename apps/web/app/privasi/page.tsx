import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '../components/landing/sections';
import { SiteHeader } from '../components/landing/site-header';

export const metadata: Metadata = {
  title: 'Kebijakan privasi · GenCV',
  description: 'Di mana data CV kamu disimpan dan apa yang dikirim saat memakai fitur AI.',
};

const SECTIONS = [
  {
    title: 'CV kamu disimpan di perangkatmu',
    body: (
      <>
        <p>
          Isi CV, deskripsi lowongan, dan foto disimpan di penyimpanan browser (localStorage) di perangkat yang kamu pakai. GenCV tidak
          punya akun pengguna dan tidak menyimpan salinan CV kamu di server.
        </p>
        <p>
          File PDF dan DOCX juga dibuat langsung di browser. Untuk menghapus data, hapus CV di halaman{' '}
          <Link href="/dashboard" className="underline hover:text-foreground">
            CV saya
          </Link>{' '}
          atau bersihkan data situs ini di pengaturan browser.
        </p>
      </>
    ),
  },
  {
    title: 'Apa yang dikirim saat memakai AI',
    body: (
      <>
        <p>
          Fitur AI hanya berjalan saat kamu menekan tombolnya. Yang dikirim adalah teks yang dibutuhkan untuk saran itu: misalnya poin
          pengalaman, ringkasan, jabatan, nama perusahaan, keahlian, peran yang dituju, dan keyword lowongan yang kamu pilih. Nama,
          email, nomor telepon, alamat, dan foto tidak ikut dikirim.
        </p>
        <p>
          Teks itu dikirim ke server GenCV, lalu diteruskan ke Google Gemini API untuk diproses. Server GenCV tidak menyimpan dan tidak
          mencatat isinya. Hasilnya muncul sebagai saran dan baru masuk ke CV jika kamu menerimanya.
        </p>
        <p>
          GenCV memakai Gemini API berbayar. Untuk layanan berbayar, Google menyatakan tidak memakai teks yang dikirim untuk
          meningkatkan produknya, tetapi dapat menyimpannya untuk sementara guna mendeteksi penyalahgunaan. Rinciannya ada di{' '}
          <a href="https://ai.google.dev/gemini-api/terms" className="underline hover:text-foreground" rel="noopener noreferrer" target="_blank">
            ketentuan Gemini API
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: 'Data teknis',
    body: (
      <p>
        Untuk membatasi jumlah permintaan AI, server mencatat alamat IP kamu bersama hitungan permintaan selama paling lama satu hari.
        Jika verifikasi keamanan Cloudflare Turnstile aktif, Cloudflare memproses sinyal dari browser untuk membedakan manusia dari bot.
        GenCV tidak memakai cookie pelacak atau analitik.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Kebijakan privasi</h1>
        <p className="mt-2 text-sm text-muted-foreground">Terakhir diperbarui 6 Oktober 2026</p>
        <div className="mt-8 space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">{section.body}</div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
