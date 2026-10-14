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
    slug: 'job-match-cocokkan-cv-dengan-lowongan',
    title: 'Job Match: Cara Membaca Kecocokan CV dengan Lowongan',
    description:
      'Job Match menunjukkan keahlian mana dari lowongan yang belum disebut di CV. Ini cara kerjanya, kenapa hasilnya bisa dijelaskan, dan batasnya.',
    datePublished: '2026-10-14',
    keywords: ['job match', 'kecocokan cv lowongan', 'keyword cv', 'cv sesuai lowongan', 'ats keyword'],
    sections: [
      {
        heading: 'Apa yang sebenarnya dibandingkan',
        paragraphs: [
          'Job Match membandingkan dua teks: isi CV kamu, dan deskripsi lowongan yang kamu tempelkan. Dari keduanya, alat ini mencari keahlian yang dikenal, lalu menunjukkan mana yang sudah kamu sebut dan mana yang belum.',
          'Yang membuat hasilnya bisa dijelaskan adalah daftar istilahnya terbatas dan terbuka. Alat ini tidak menebak relevansi dari kemiripan makna, dan tidak memakai model bahasa. Kalau sebuah keahlian muncul di daftar, ia dikenali. Kalau tidak ada di daftar, ia tidak dihitung.',
          'Konsekuensinya penting untuk kamu tahu: Job Match hanya mengenali keahlian yang memang ada di daftarnya. Bidang yang sangat khusus mungkin belum tercakup.',
        ],
        bullets: [
          'Yang dibandingkan: teks CV kamu dan deskripsi lowongan.',
          'Pencocokan memakai daftar istilah tetap, bukan tebakan model.',
          'Keahlian di luar daftar tidak akan muncul di hasil.',
        ],
      },
      {
        heading: 'Pencocokan utuh, bukan potongan kata',
        paragraphs: [
          'Satu hal yang sering salah pada pencocokan sederhana: istilah pendek ikut cocok di dalam istilah panjang. Contoh klasiknya java dan javascript. Kalau pencocokan dilakukan dengan mencari potongan teks, java akan dianggap ada di dalam javascript, dan hasilnya salah.',
          'Karena itu pencocokan di sini menuntut batas kata. Java hanya cocok kalau yang tertulis memang java, bukan javascript. Hal yang sama berlaku untuk sql dan nosql, serta react dan react native.',
          'Ada satu perilaku lagi yang perlu kamu tahu. Kalau lowongan menyebut dua istilah yang saling mencakup, hanya yang lebih spesifik yang dihitung. Lowongan yang menyebut react dan react native akan menghasilkan satu keyword, yaitu react native. Tujuannya supaya satu keahlian tidak dihitung dua kali dan menurunkan skormu tanpa alasan.',
        ],
      },
      {
        heading: 'Istilah yang setara digabung',
        paragraphs: [
          'Lowongan jarang memakai satu ejaan saja. Ada yang menulis k8s, ada yang menulis kubernetes. Ada yang menulis reactjs, ada yang menulis react. Ada yang menulis postgres, ada yang menulis postgresql.',
          'Sebelum dibandingkan, kedua teks diseragamkan lebih dulu. Jadi k8s di CV tetap dianggap cocok dengan kubernetes di lowongan, dan sebaliknya. Tanpa langkah ini, kamu akan melihat keyword yang sebenarnya sudah kamu kuasai muncul sebagai belum disebut.',
        ],
        bullets: [
          'k8s setara kubernetes.',
          'reactjs dan react.js setara react.',
          'node dan nodejs setara node.js.',
          'postgres setara postgresql.',
          'ci/cd setara continuous integration.',
          'amazon web services setara aws.',
        ],
      },
      {
        heading: 'Di mana saja di CV keyword dicari',
        paragraphs: [
          'Keahlian tidak harus ada di bagian keahlian. Pencarian mencakup seluruh bagian yang dibaca mesin: profesi di bawah nama, ringkasan profesional, posisi dan nama perusahaan, seluruh poin pencapaian di pengalaman, proyek beserta teknologinya, pendidikan, sertifikasi, bahasa, dan bagian tambahan.',
          'Ini sering menyelamatkan. Kamu mungkin menyebut docker hanya di dalam poin pencapaian, bukan di daftar keahlian. Itu tetap terhitung.',
        ],
      },
      {
        heading: 'Cara menghitung skornya',
        paragraphs: [
          'Skor Job Match adalah jumlah keyword yang cocok dibagi jumlah keyword yang ditemukan di lowongan, dikali seratus. Sederhana dan bisa kamu hitung sendiri.',
          'Kalau lowongan memuat enam keahlian yang dikenali dan CV kamu menyebut tiga di antaranya, skornya 50. Kalau menyebut semuanya, skornya 100. Kalau tidak menyebut satu pun, skornya 0.',
          'Ada satu kondisi yang perlu dipahami: kalau kamu belum menempelkan deskripsi lowongan, komponen ini tidak dihitung sama sekali. Skor total tetap bisa keluar dari empat komponen lain. Begitu juga kalau lowongan tidak memuat satu pun keahlian yang dikenali, maka tidak ada yang bisa dibandingkan dan komponen ini dilewati.',
        ],
      },
      {
        heading: 'Bobotnya dalam skor keseluruhan',
        paragraphs: [
          'Job Match menyumbang 15 persen dari skor keseluruhan. Sisanya: kelengkapan 25 persen, kualitas konten 25 persen, keterbacaan 20 persen, dan format 15 persen.',
          'Angka itu menjelaskan prioritas. Memperbaiki Job Match dari 0 ke 100 paling banyak menaikkan skor keseluruhan sekitar 15 poin. CV yang lengkap dan poin pencapaiannya jelas tetap lebih menentukan, dan itu memang seharusnya begitu: keahlian yang disebut tanpa bukti tidak banyak menolong.',
        ],
      },
      {
        heading: 'Cara memakai hasilnya tanpa berbohong',
        paragraphs: [
          'Saran yang muncul saat ada keyword belum disebut selalu berbunyi sama: tambahkan hanya jika memang kamu kuasai. Ini bukan kalimat basa-basi.',
          'Menambahkan keahlian yang tidak kamu punya akan terlihat saat wawancara, dan itu jauh lebih merugikan daripada skor yang rendah. Yang lebih berguna adalah memakai daftar itu sebagai bahan berpikir: apakah kamu pernah memakai alat itu di proyek yang belum kamu tulis? Apakah ada pengalaman yang relevan tapi belum masuk CV?',
          'Kalau setelah ditelusuri memang belum pernah, tidak apa-apa. Lowongan tidak mengharapkan setiap syarat terpenuhi. Yang penting CV kamu jujur dan bagian yang memang kamu kuasai terlihat jelas.',
        ],
      },
      {
        heading: 'Yang tidak bisa dilakukan Job Match',
        paragraphs: [
          'Job Match tidak tahu apakah kamu akan dipanggil wawancara. Ia hanya membandingkan teks. Banyak hal yang menentukan hasil lamaran tidak ada di dalam CV: portofolio, rujukan, waktu melamar, jumlah pelamar, dan kecocokan dengan tim.',
          'Ia juga tidak membaca deskripsi lowongan sebagai manusia. Kalau lowongan menulis keahlian dengan istilah yang tidak ada di daftar, istilah itu tidak akan muncul di hasil meskipun penting. Jadi perlakukan hasilnya sebagai petunjuk, bukan daftar lengkap syarat.',
          'Dan seperti alat lain, ia tidak bisa menjamin apa pun soal seleksi. Yang bisa ia lakukan cuma satu: menunjukkan bagian mana dari CV kamu yang belum menyebut keahlian yang diminta lowongan.',
        ],
      },
    ],
  },
  {
    slug: 'arti-skor-ats',
    title: 'Arti Skor ATS: Apa yang Benar-Benar Dihitung dan Apa yang Tidak',
    description:
      'Skor ATS itu estimasi dari aturan yang bisa dilihat, bukan ramalan. Ini arti tiap komponen, cara membacanya, dan batas yang perlu kamu tahu.',
    datePublished: '2026-10-14',
    keywords: ['skor ats', 'cek skor cv', 'analisis cv', 'nilai cv ats', 'ats score'],
    sections: [
      {
        heading: 'Skor ATS bukan ramalan, tapi perhitungan',
        paragraphs: [
          'Banyak alat menampilkan satu angka besar lalu menyebutnya skor ATS, tanpa menjelaskan dari mana angka itu datang. Di GenCV, angka itu dihitung dari aturan tetap yang bisa kamu periksa sendiri. Tidak ada model yang menebak, tidak ada data perusahaan mana pun yang dipakai.',
          'Perbedaan ini penting. Kalau skor berasal dari aturan yang terbuka, kamu bisa menilai apakah sarannya masuk akal untuk situasi kamu. Kalau skor berasal dari kotak hitam, satu-satunya cara mempercayainya adalah percaya begitu saja.',
        ],
        bullets: [
          'Skornya estimasi dari aturan, bukan prediksi hasil lamaran.',
          'Tiap temuan punya alasan yang bisa dibaca, bukan cuma angka.',
          'Tidak ada data pelamar atau perusahaan yang terlibat.',
        ],
      },
      {
        heading: 'Lima komponen dan bobotnya',
        paragraphs: [
          'Skor total adalah rata-rata berbobot dari lima komponen. Bobotnya berbeda karena tidak semua bagian sama pentingnya untuk terbaca mesin maupun manusia.',
          'Kelengkapan dan kualitas konten masing-masing berbobot 25 persen, keterbacaan 20 persen, lalu format dan struktur 15 persen, dan kecocokan keyword 15 persen.',
          'Komponen kecocokan keyword hanya muncul kalau kamu menempelkan deskripsi lowongan. Tanpa lowongan, bobotnya dibagi ke komponen lain, jadi skornya tetap bisa dihitung.',
        ],
        bullets: [
          'Kelengkapan 25 persen: bagian utama CV sudah terisi atau belum.',
          'Kualitas konten 25 persen: poin pencapaian diawali kata kerja aktif dan memuat angka.',
          'Keterbacaan 20 persen: panjang poin dan ringkasan masih nyaman dibaca.',
          'Format dan struktur 15 persen: tanggal lengkap, satu kolom, judul bagian standar.',
          'Kecocokan keyword 15 persen: keahlian di lowongan yang sudah kamu sebut.',
        ],
      },
      {
        heading: 'Kelengkapan: sembilan hal yang diperiksa',
        paragraphs: [
          'Komponen kelengkapan memeriksa sembilan bagian: nama lengkap, email, nomor telepon, lokasi, profesi di bawah nama, ringkasan profesional, pengalaman atau proyek, pendidikan, dan minimal lima keahlian.',
          'Bagian yang belum ada muncul sebagai temuan dengan tingkat issue, bukan sekadar peringatan. Artinya bagian itu memang kosong dan biasanya yang paling cepat menaikkan skor kalau diisi.',
        ],
      },
      {
        heading: 'Kualitas konten: kata kerja, angka, dan klise',
        paragraphs: [
          'Di komponen ini, setiap poin pencapaian diberi nilai dari dua hal. Enam puluh persen dari apakah poin itu dibuka kata kerja aktif, dan empat puluh persen dari apakah poin itu memuat angka.',
          'Kalau poin dibuka frasa tugas seperti bertanggung jawab atas, nilainya hilang. Kalau poin tidak memuat angka sama sekali, sebagian nilainya juga hilang. Tapi ada pengecualian penting: angka yang masih berupa placeholder seperti [X%] belum dihitung sebagai angka, karena itu belum data asli.',
          'Selain itu, alat ini menandai klise seperti pekerja keras atau mampu bekerja di bawah tekanan, dan memberi peringatan kalau satu kata kerja yang sama membuka empat poin atau lebih.',
        ],
        bullets: [
          'Awali dengan kata kerja aktif: membangun, menurunkan, mengotomatisasi.',
          'Sebutkan angka kalau kamu punya. Kalau tidak punya, jangan mengarang.',
          'Hindari klise sifat, tunjukkan buktinya lewat pencapaian.',
          'Variasikan kata kerja pembuka supaya tidak monoton.',
        ],
      },
      {
        heading: 'Keterbacaan: batas yang dipakai',
        paragraphs: [
          'Poin pencapaian yang lebih dari 35 kata ditandai terlalu panjang, dan yang kurang dari 4 kata ditandai terlalu singkat. Kata ganti orang pertama seperti saya juga ditandai, karena CV lazimnya ditulis tanpa subjek.',
          'Ringkasan profesional diberi batas berbeda: kalau lebih dari 90 kata, muncul saran untuk memangkasnya ke kisaran 40 sampai 80 kata.',
        ],
      },
      {
        heading: 'Format dan struktur: dua aturan yang sering terlewat',
        paragraphs: [
          'Setiap pengalaman harus punya tanggal mulai dan tanggal selesai yang lengkap. Ini bukan formalitas: sistem pelacak pelamar memakai tanggal untuk menghitung lama pengalaman, dan tanggal yang kosong membuat datanya dianggap tidak lengkap.',
          'Jumlah poin pencapaian juga dibatasi sesuai negara tujuan. Untuk lamaran ke Amerika Serikat, batasnya 18 poin karena CV di sana lazimnya satu halaman. Untuk format A4, batasnya 30 poin. Foto tidak dihitung untuk lamaran ke perusahaan multinasional, karena sistem tidak membacanya.',
        ],
      },
      {
        heading: 'Cara membaca angkanya tanpa terjebak mengejar skor',
        paragraphs: [
          'Skor dipecah jadi empat label: 85 ke atas sangat baik, 70 ke atas baik, 50 ke atas cukup, dan di bawah 50 perlu perbaikan. Label ini untuk memberi gambaran cepat, bukan target yang harus dikejar sampai angka tertentu.',
          'Yang lebih berguna adalah membaca temuan, bukan angkanya. Satu temuan bertingkat issue biasanya menurunkan skor lebih besar daripada lima temuan bertingkat peringatan. Perbaiki yang issue dulu, baru yang peringatan.',
          'Ingat juga bahwa skor tinggi tidak berarti kamu akan dipanggil wawancara. Yang dinilai di sini adalah seberapa rapi CV kamu terbaca dan seberapa jelas pencapaianmu ditulis. Keputusan merekrut tetap ada di tangan manusia, dan itu dipengaruhi banyak hal yang tidak ada di dalam CV.',
        ],
      },
      {
        heading: 'Yang tidak bisa dijamin skor mana pun',
        paragraphs: [
          'Tidak ada alat, jasa, atau orang yang bisa menjamin CV kamu lolos sistem pelacak pelamar. Setiap perusahaan memakai sistem dan pengaturan yang berbeda, dan banyak di antaranya menyesuaikan filternya sendiri. Sebagian bahkan tidak memakai penyaringan otomatis sama sekali.',
          'Karena itu, waspadai layanan yang menampilkan persentase kelulusan atau jaminan lolos. Angka seperti itu tidak bisa diukur dari luar, jadi nilainya tidak bisa diverifikasi. Yang bisa kamu pegang adalah aturan yang jelas: apakah CV kamu terbaca, apakah pencapaianmu ditulis dengan bukti, dan apakah keahlian yang diminta sudah kamu sebut.',
        ],
      },
    ],
  },
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
