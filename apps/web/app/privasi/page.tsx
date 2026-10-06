import type { Metadata } from 'next';
import Link from 'next/link';
import { OPERATOR, pageMetadata } from '@/lib/seo';
import { LegalPage, type LegalSection } from '../components/legal-page';

export const metadata: Metadata = pageMetadata({
  title: 'Kebijakan privasi',
  description: 'Di mana data CV kamu disimpan, apa yang dikirim saat memakai fitur AI, dan data teknis yang dicatat.',
  path: '/privasi',
});

const SECTIONS: LegalSection[] = [
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
    title: 'Statistik kunjungan',
    body: (
      <>
        <p>
          Untuk mengetahui halaman mana yang dipakai, GenCV memakai Vercel Web Analytics, yang tidak memakai cookie. Yang dicatat:
          halaman yang dibuka (tanpa parameter di URL), situs perujuk, negara, serta jenis perangkat, sistem operasi, dan browser.
          Isi CV tidak pernah ikut dikirim.
        </p>
        <p>
          Pengunjung tidak diidentifikasi secara pribadi: kunjungan dihitung dengan kode acak yang berganti setiap hari. Rinciannya
          ada di{' '}
          <a href="https://vercel.com/docs/analytics/privacy-policy" className="underline hover:text-foreground" rel="noopener noreferrer" target="_blank">
            kebijakan privasi Vercel Web Analytics
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: 'Data teknis dan cookie',
    body: (
      <>
        <p>
          Untuk membatasi jumlah permintaan AI, server mencatat alamat IP kamu bersama hitungan permintaan selama paling lama satu
          hari. Jika verifikasi keamanan Cloudflare Turnstile aktif, Cloudflare memproses sinyal dari browser untuk membedakan
          manusia dari bot.
        </p>
        <p>
          GenCV tidak memakai cookie pelacak atau iklan. Satu-satunya penyimpanan di browser adalah localStorage untuk menyimpan
          CV kamu, dan itu diperlukan agar aplikasi berfungsi, jadi tidak ada banner persetujuan cookie.
        </p>
      </>
    ),
  },
  {
    title: 'Hak kamu',
    body: (
      <p>
        Karena CV tidak disimpan di server, kamu memegang kendali penuh: lihat, ubah, ekspor (JSON), atau hapus kapan saja dari
        perangkatmu. Untuk pertanyaan soal data teknis di atas, hubungi kontak di bawah.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Kebijakan privasi"
      updated="6 Oktober 2026"
      intro={<p>Kebijakan ini menjelaskan data apa yang diproses GenCV, layanan milik {OPERATOR}, dan ke mana data itu pergi.</p>}
      sections={SECTIONS}
    />
  );
}
