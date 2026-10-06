import type { Metadata } from 'next';
import Link from 'next/link';
import { OPERATOR, pageMetadata } from '@/lib/seo';
import { LegalPage, type LegalSection } from '../components/legal-page';

export const metadata: Metadata = pageMetadata({
  title: 'Syarat dan ketentuan',
  description: 'Ketentuan memakai GenCV: tanpa jaminan lolos ATS, tanggung jawab atas isi CV, penggunaan AI yang wajar, dan penyimpanan data.',
  path: '/syarat',
});

const SECTIONS: LegalSection[] = [
  {
    title: 'Tentang layanan',
    body: (
      <p>
        GenCV adalah alat bantu gratis untuk menulis, menganalisis, dan mengekspor CV, dikelola oleh {OPERATOR}. Fitur dapat berubah,
        dibatasi, atau dihentikan sewaktu-waktu.
      </p>
    ),
  },
  {
    title: 'Tidak ada jaminan hasil',
    body: (
      <p>
        Skor ATS dan Job Match adalah estimasi berbasis aturan, bukan hasil dari sistem perekrutan tertentu. Setiap ATS dan perekrut
        bekerja berbeda, jadi GenCV tidak menjamin CV kamu lolos penyaringan, dipanggil interview, atau diterima kerja.
      </p>
    ),
  },
  {
    title: 'Isi CV adalah tanggung jawabmu',
    body: (
      <>
        <p>Kamu bertanggung jawab atas kebenaran semua isi CV, termasuk teks dari saran AI yang kamu terima.</p>
        <p>
          Saran AI hanya usulan. Periksa sebelum menerima, ganti placeholder seperti [X%] dengan angka asli atau hapus, dan jangan
          mencantumkan pengalaman, keahlian, atau pencapaian yang tidak benar.
        </p>
      </>
    ),
  },
  {
    title: 'Penggunaan AI yang wajar',
    body: (
      <>
        <p>
          Fitur AI punya batas jumlah permintaan. Dilarang memakai GenCV secara otomatis atau massal, mencoba melewati batas atau
          pengamanannya, atau mengirim konten yang melanggar hukum.
        </p>
        <p>
          Teks yang kamu minta untuk diperbaiki diproses oleh Google Gemini; lihat{' '}
          <Link href="/privasi" className="underline hover:text-foreground">
            kebijakan privasi
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    title: 'Data dan cadangan',
    body: (
      <p>
        CV tersimpan di browser perangkatmu, bukan di server {OPERATOR}. Menghapus data browser, memakai mode penyamaran, atau
        berganti perangkat bisa membuat CV hilang, dan kami tidak dapat memulihkannya. Simpan cadangan lewat menu Export → Backup
        data (JSON).
      </p>
    ),
  },
  {
    title: 'Hak atas konten',
    body: (
      <p>
        Isi CV sepenuhnya milikmu, dan hasil ekspor bebas kamu pakai untuk melamar kerja atau keperluan lain. Desain template,
        tampilan, dan kode GenCV milik {OPERATOR}.
      </p>
    ),
  },
  {
    title: 'Batasan tanggung jawab',
    body: (
      <p>
        GenCV disediakan apa adanya. Sejauh diizinkan hukum, {OPERATOR} tidak bertanggung jawab atas kerugian yang timbul dari
        pemakaian layanan, termasuk hilangnya data di perangkat, kesalahan isi CV, atau keputusan perekrutan.
      </p>
    ),
  },
  {
    title: 'Perubahan dan hukum yang berlaku',
    body: (
      <p>
        Syarat ini dapat diperbarui; tanggal di atas menunjukkan versi terakhir. Dengan terus memakai GenCV, kamu menyetujui versi
        terbaru. Syarat ini tunduk pada hukum Republik Indonesia.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Syarat dan ketentuan"
      updated="6 Oktober 2026"
      intro={<p>Dengan memakai GenCV, kamu menyetujui ketentuan berikut.</p>}
      sections={SECTIONS}
    />
  );
}
