/**
 * Artikel ditulis sebagai data, bukan MDX: tidak ada dependency baru, dan karena tidak ada
 * parser markdown yang jalan, tidak ada permukaan XSS. Setiap paragraf jadi teks React biasa.
 *
 * Isinya sengaja mengikuti aturan yang benar-benar dipakai produk (lihat
 * lib/cv/analysis/analyze.ts), supaya artikel dan fitur tidak saling bertentangan.
 */

export interface PostSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface Post {
  slug: string;
  title: string;
  /** Dipakai untuk meta description, kartu daftar artikel, dan JSON-LD. */
  description: string;
  /** ISO 8601; muncul di JSON-LD sebagai datePublished. */
  datePublished: string;
  keywords: string[];
  sections: PostSection[];
}

export const POSTS: Post[] = [
  {
    slug: 'cara-membuat-cv-ramah-ats',
    title: 'Cara Membuat CV yang Ramah ATS (dan Cara Mengujinya Sendiri)',
    description:
      'ATS membaca teks, urutan, dan judul bagian — bukan desain. Panduan praktis menyusun CV satu kolom, plus cara mengujinya sendiri sebelum melamar.',
    datePublished: '2026-10-14',
    keywords: ['cara membuat cv ats', 'cv ramah ats', 'ats friendly', 'format cv ats'],
    sections: [
      {
        heading: 'Apa yang sebenarnya dilakukan ATS',
        paragraphs: [
          'Applicant Tracking System bukan penilai. Ia pengurai. Tugasnya mengubah berkas CV jadi data terstruktur — nama, kontak, riwayat kerja, pendidikan — supaya rekruter bisa mencari dan menyaring pelamar. Jadi yang menentukan CV kamu terbaca atau tidak bukan seberapa bagus desainnya, tapi seberapa mudah mesinnya menemukan bagian-bagian itu.',
          'Dua hal paling sering menggagalkan tahap ini: teks yang sebenarnya bukan teks (nama atau kontak yang dicetak di dalam gambar, ikon, atau grafik), dan urutan baca yang tidak jelas karena layout berkolom atau bertabel. Keduanya terlihat rapi di mata manusia, tapi berantakan saat diurai mesin.',
        ],
        bullets: [
          'ATS membaca teks, bukan tampilan.',
          'Urutan baca harus jelas: satu kolom, dari atas ke bawah.',
          'Judul bagian yang standar lebih aman daripada judul kreatif.',
          'CV hasil pindai (scan) hampir selalu gagal diurai.',
        ],
      },
      {
        heading: 'Struktur satu kolom: urutan yang aman',
        paragraphs: [
          'Urutan yang paling jarang bermasalah: nama, kontak, ringkasan profesional, pengalaman kerja, pendidikan, keahlian, lalu bagian tambahan seperti sertifikasi, proyek, bahasa, dan organisasi. Nama bagian pakai istilah yang umum — "Pengalaman Kerja", bukan "Jejak Langkah Karier".',
          'Kalau kamu melamar ke luar negeri, isi CV bisa berbahasa Inggris, tapi jangan campur dua bahasa dalam satu dokumen. Campuran bahasa membuat pencocokan kata kunci jadi tidak konsisten.',
        ],
      },
      {
        heading: 'Poin pengalaman: yang dibaca manusia dan mesin',
        paragraphs: [
          'Setiap posisi sebaiknya punya tanggal mulai dan selesai yang lengkap. Ini bukan formalitas: ATS memakai tanggal untuk menghitung lama pengalaman. Kalau salah satu tanggal kosong, sistem sering menganggapnya tidak lengkap.',
          'Untuk isinya, tulis pencapaian, bukan daftar tugas. Bandingkan "Bertanggung jawab atas laporan penjualan" dengan "Menyusun laporan penjualan bulanan untuk 4 cabang, memangkas waktu rekap dari 3 hari jadi 1 hari". Yang kedua menyebut hasil dan skala. Kalau kamu punya angkanya, sebutkan. Kalau tidak punya, jangan mengarang — tulis dampaknya secara kualitatif saja.',
        ],
      },
      {
        heading: 'Cara menguji CV kamu sendiri',
        paragraphs: [
          'Sebelum melamar, periksa lima hal ini. Kelengkapan: apakah nama, email, telepon, lokasi, ringkasan, pengalaman, pendidikan, dan minimal lima keahlian sudah terisi? Format: apakah setiap posisi punya tanggal lengkap dan nama perusahaan? Keterbacaan: apakah kalimatnya tidak terlalu panjang — sekitar 14 sampai 22 kata per kalimat sudah nyaman. Kualitas isi: apakah poinnya dibuka kata kerja tindakan dan memuat angka nyata. Kecocokan kata kunci: apakah istilah keahlian yang diminta lowongan sudah muncul di CV kamu.',
          'Lima hal itu juga yang dihitung GenCV di panel Analisis ATS. Skornya estimasi dari aturan yang bisa dilihat — bukan ramalan apakah kamu akan lolos di perusahaan tertentu.',
        ],
      },
      {
        heading: 'Yang tidak bisa dijamin siapa pun',
        paragraphs: [
          'Tidak ada alat, jasa, atau orang yang bisa menjamin CV kamu lolos ATS. Setiap perusahaan memakai sistem dan pengaturan yang berbeda, dan banyak yang menyaring dengan cara yang sama sekali tidak otomatis. Yang bisa dilakukan cuma satu: membuat formatnya mudah dibaca mesin dan isinya relevan dengan lowongan. Sisanya ada di tangan rekruter.',
          'Kalau ada yang menjanjikan tingkat kelulusan sekian persen, pertanyaannya sederhana: dari data siapa angka itu dihitung?',
        ],
      },
    ],
  },
  {
    slug: 'cv-bahasa-inggris-a4-atau-us-letter',
    title: 'CV Bahasa Inggris: A4 atau US Letter, dan Aturan Lain yang Berubah',
    description:
      'Melamar ke Amerika Serikat bukan cuma soal menerjemahkan CV. Ukuran kertas, foto, dan jumlah poin pencapaian punya aturan berbeda.',
    datePublished: '2026-10-14',
    keywords: ['cv bahasa inggris', 'cv lamaran luar negeri', 'us letter', 'resume amerika'],
    sections: [
      {
        heading: 'Bukan cuma soal ukuran kertas',
        paragraphs: [
          'A4 dan US Letter memang beda dimensi, dan itu berpengaruh ke berapa banyak isi yang muat di satu halaman. Tapi perbedaan yang lebih penting adalah kebiasaan perekrutan di masing-masing tempat.',
          'Di Indonesia, CV dua halaman dengan foto masih umum dan diterima. Di Amerika Serikat, CV satu halaman tanpa foto adalah norma, terutama untuk pelamar dengan pengalaman di bawah sepuluh tahun. Mengirim CV bergaya Indonesia ke perusahaan AS membuat kamu terlihat tidak menyesuaikan diri, bahkan sebelum isinya dinilai.',
        ],
      },
      {
        heading: 'Aturan yang berubah saat melamar ke AS',
        paragraphs: [
          'Pertama, foto. Untuk lamaran ke AS, foto sebaiknya tidak dicantumkan. Selain tidak lazim, ada alasan hukum: perusahaan berusaha menghindari informasi yang bisa memicu tuduhan diskriminasi dalam proses seleksi.',
          'Kedua, panjang. Usahakan satu halaman. Artinya poin pencapaian perlu dipangkas — pilih yang paling relevan dengan posisi yang dilamar, bukan semua yang pernah kamu kerjakan. Sebagai gambaran, sekitar 18 poin pencapaian sudah batas atas yang aman untuk satu halaman; kalau lebih, biasanya jadi dua halaman.',
          'Ketiga, judul bagian. Pakai istilah standar Amerika: "Experience" atau "Work Experience", "Education", "Skills", "Projects", "Certifications".',
        ],
      },
      {
        heading: 'Format tanggal yang aman',
        paragraphs: [
          'Pakai format yang tidak ambigu. "03/2024" bisa dibaca Maret atau April tergantung kebiasaan pembaca. Tulis "March 2024" atau "Mar 2024" untuk CV bahasa Inggris, dan "Maret 2024" untuk bahasa Indonesia. Ini kelihatan sepele, tapi tanggal yang salah baca membuat lama pengalaman dihitung keliru.',
          'Untuk posisi yang masih berjalan, tulis "Present" atau "Sekarang", bukan mengosongkan kolom tanggal selesai.',
        ],
      },
      {
        heading: 'Jangan campur dua bahasa dalam satu CV',
        paragraphs: [
          'Kalau CV-nya bahasa Inggris, seluruhnya bahasa Inggris — termasuk judul bagian, nama bulan, dan label seperti "Email" dan "Phone". Campuran bahasa membuat pencocokan kata kunci jadi tidak konsisten dan terlihat tidak rapi.',
          'Kalau kamu butuh dua versi, buat dua CV terpisah: satu bahasa Indonesia untuk lamaran lokal, satu bahasa Inggris untuk lamaran luar negeri. Isinya boleh mirip, formatnya tidak perlu dipaksa sama.',
        ],
      },
      {
        heading: 'Ringkasnya',
        paragraphs: [
          'Untuk lamaran ke Amerika Serikat: kertas US Letter, satu halaman, tanpa foto, judul bagian bahasa Inggris, maksimal sekitar 18 poin pencapaian. Untuk lamaran lokal: kertas A4, sampai dua halaman, foto opsional, maksimal sekitar 30 poin.',
          'GenCV menyimpan pilihan ini sebagai pengaturan "Melamar ke" di editor, dan aturan analisisnya ikut menyesuaikan. Jadi kamu tidak perlu mengingat daftar di atas setiap kali.',
        ],
      },
    ],
  },
  {
    slug: 'contoh-cv-fresh-graduate-tanpa-pengalaman',
    title: 'Contoh CV Fresh Graduate Tanpa Pengalaman Kerja',
    description:
      'Tanpa riwayat kerja, CV bukan berarti kosong. Ini bagian yang bisa diisi, dan cara menulis poin pencapaian saat kamu belum punya angka.',
    datePublished: '2026-10-14',
    keywords: ['contoh cv fresh graduate', 'cv tanpa pengalaman', 'cv lulusan baru', 'cv pertama'],
    sections: [
      {
        heading: 'Tanpa pengalaman kerja bukan berarti CV kosong',
        paragraphs: [
          'Fresh graduate hampir selalu merasa CV-nya kosong. Padahal yang dicari rekruter pada pelamar tingkat awal bukan riwayat kerja, tapi bukti bahwa kamu bisa menyelesaikan sesuatu dan belajar cepat. Bukti itu bisa datang dari mana saja.',
          'Yang penting bukan besar atau kecilnya pengalaman, tapi apakah kamu bisa menjelaskan apa yang kamu kerjakan dan apa hasilnya.',
        ],
      },
      {
        heading: 'Bagian yang bisa diisi',
        paragraphs: [
          'Susun ulang prioritas bagiannya. Karena belum ada pengalaman kerja, taruh bagian yang paling kuat di atas — biasanya pendidikan, lalu proyek, organisasi, atau magang.',
        ],
        bullets: [
          'Proyek kuliah, tugas akhir, atau skripsi — sebutkan masalah yang diselesaikan dan hasilnya.',
          'Magang, kerja praktik, atau program Kampus Merdeka.',
          'Organisasi dan kepanitiaan — sebutkan peran dan tanggung jawab nyata, bukan hanya nama organisasi.',
          'Freelance, jualan online, mengajar les, atau proyek pribadi.',
          'Sertifikasi dan kursus yang relevan dengan posisi yang dilamar.',
          'Lomba, hackathon, atau kompetisi lain beserta hasilnya.',
        ],
      },
      {
        heading: 'Cara menulis poin pencapaian tanpa angka',
        paragraphs: [
          'Nasihat "kuantifikasi pencapaianmu" sering buntu untuk fresh graduate — belum ada data penjualan atau jumlah pengguna untuk dilaporkan. Jangan mengarang angka. Ada tiga cara lain yang jujur.',
          'Pertama, sebutkan skala yang nyata: "untuk 6 mata kuliah", "bersama tim 4 orang", "selama 3 bulan". Kedua, sebutkan hasil yang bisa dibuktikan: "dipresentasikan di depan 3 dosen penguji dan mendapat nilai A", "dipakai oleh 2 angkatan setelahnya". Ketiga, sebutkan teknologi atau metode yang kamu pakai, karena itu menunjukkan kemampuan teknis.',
          'Kalau angka akan memperkuat tapi kamu belum punya datanya, tinggalkan tempat kosong dan isi nanti setelah kamu cek. Menulis "meningkatkan [X%]" lebih jujur daripada menebak, dan kamu bisa mengisi angkanya sebelum mengirim.',
        ],
      },
      {
        heading: 'Pilih template paling konservatif',
        paragraphs: [
          'Untuk pelamar tingkat awal, template paling sederhana justru paling aman. Tanpa pengalaman kerja yang banyak, layout yang ramai hanya menyisakan sedikit ruang untuk hal yang penting, dan menambah risiko urutan baca jadi kacau.',
          'Template Minimal — hitam-putih tanpa aksen warna — atau Professional dengan aksen biru tipis biasanya cukup. Simpan template yang lebih berani untuk saat kamu sudah punya lebih banyak isi.',
        ],
      },
      {
        heading: 'Ringkasan profesional: dua sampai tiga kalimat',
        paragraphs: [
          'Bagian ini sering diisi kalimat umum seperti "saya adalah pribadi yang pekerja keras dan mudah beradaptasi". Itu tidak membedakan kamu dari pelamar lain. Ganti dengan sesuatu yang spesifik: jurusan, bidang yang kamu kuasai, dan arah yang kamu tuju.',
          'Contohnya: "Lulusan Teknik Informatika yang fokus pada pengembangan web. Terbiasa membangun aplikasi dengan React dan Node.js melalui proyek kuliah dan magang 3 bulan. Mencari posisi frontend developer untuk mengembangkan kemampuan di tim produksi." Spesifik, dan bisa diverifikasi dari bagian lain CV.',
        ],
      },
    ],
  },
];

const WORDS_PER_MINUTE = 200;

function wordCount(post: Post): number {
  const text = [post.title, post.description, ...post.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])])].join(' ');
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Dihitung dari isi, bukan ditulis tangan, supaya tidak pernah meleset. */
export function readingMinutes(post: Post): number {
  return Math.max(1, Math.round(wordCount(post) / WORDS_PER_MINUTE));
}

/** Terbaru dulu. */
export function allPosts(): Post[] {
  return [...POSTS].sort((a, b) => b.datePublished.localeCompare(a.datePublished));
}

export function getPost(slug: string): Post | undefined {
  return POSTS.find((post) => post.slug === slug);
}
