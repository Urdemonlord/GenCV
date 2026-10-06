# Rencana GenCV: dari CV Generator ke Career Workspace

Terakhir diperbarui: 6 Oktober 2026
Branch Fase 0: `fix/phase-0-cv-output`

## Tujuan

GenCV menjadi **workspace untuk membuat, mengoptimalkan, dan menyesuaikan CV terhadap pekerjaan yang dituju**. Polanya Build → Optimize → Apply, bukan sekadar generator.

Arah visual mengikuti mockup redesign: landing page gelap yang editorial, dan editor bergaya workspace dengan kolom sidebar, form, preview, dan analisis.

## Prinsip yang tidak ditawar

1. **Setiap angka di produk dihitung dari data user.** Skor ATS dan Job Match berasal dari aturan yang bisa dijelaskan, diberi label "estimasi", dan tidak menjanjikan "pasti lolos".
2. **AI tidak mengarang.** AI tidak boleh menambah angka, tool, atau pencapaian yang tidak diberikan user. Kalau metrik akan membantu, AI memakai placeholder seperti `[X%]` lalu bertanya ke user.
3. **Output tetap ramah ATS.** Teks asli (bukan gambar), heading standar, urutan baca benar. Tampilan template boleh beda-beda, struktur ini tidak.
4. **Tidak ada link mati atau klaim palsu.** Menu dan angka di landing page hanya untuk fitur yang memang ada.
5. **Data CV tetap di perangkat user.** Data baru dikirim ke server untuk fitur AI, dan itu dijelaskan di kebijakan privasi.

## Roadmap

Satu baris tabel = satu PR, dikerjakan berurutan.

| # | Milestone | Isi utama | Ukuran | Status |
|---|---|---|---|---|
| 0 | Output harus benar |PDF/DOCX baru, bug wizard, dependency | – | Selesai (PR) |
| 0.5 | Next 15 + React 19 | Upgrade framework, tutup advisory | Sedang | Selesai (PR) |
| T | Jaring pengaman | Unit test `lib/cv`, test ekstraksi PDF, CI | Kecil | Belum |
| R1 | Design system & shell | Token warna, font, komponen dasar | Sedang | Belum |
| R2 | Model data v2 | Schema zod, bullets, section baru, bahasa CV, foto opsional | Besar | Belum |
| R3 | Editor workspace | Layout 4 kolom, form baru, preview, export | Besar | Belum |
| R4 | Analisis ATS & Job Match | Skor dan keyword match tanpa AI | Sedang | Belum |
| R5 | Landing page | Hero, section fitur, visual produk asli | Sedang | Belum |
| R6 | Template & galeri | 6 template, halaman `/templates` | Sedang–besar | Belum |
| R7 | Dashboard multi-CV | Satu CV per lowongan, disimpan lokal | Sedang | Belum |
| R8 | AI Assistant | Satu modul AI, saran sebelum/sesudah | Besar | Belum |
| C | Bersih-bersih repo | Scaffold root, `dist/`, `.d.ts` palsu, README | Sedang | Belum |

Kenapa urutannya begini:

- Editor adalah jantung produk, jadi R1–R4 dikerjakan duluan dan landing page (R5) mengikuti bahasa visualnya.
- Upgrade framework (0.5) dan test (T) didahulukan supaya komponen baru langsung ditulis di React 19 dan punya jaring pengaman.

---

## 0. Output harus benar (hampir selesai)

### Sudah dikerjakan

Sudah diverifikasi dengan `tsc`, `next build`, dan tes di production server lokal.

- [x] PDF dibuat di browser dengan `@react-pdf/renderer` (`apps/web/lib/cv/pdf/`)
  - 3 template satu kolom yang ramah ATS
  - Font Unicode Inter dan Source Serif 4
  - Link aktif, metadata PDF, nomor halaman, judul section tidak tertinggal di bawah halaman
- [x] Preview menampilkan PDF yang sama persis dengan yang di-download (`apps/web/app/components/cv-preview/pdf-preview.tsx`)
- [x] DOCX dibuat di browser (`apps/web/lib/cv/docx.ts`) dengan heading, bullet, dan hyperlink asli
- [x] Satu sumber format untuk semua export (`apps/web/lib/cv/format.ts`), plus normalisasi draft lama dan file import (`apps/web/lib/cv/normalize.ts`)
- [x] Bug wizard yang diperbaiki:
  - Checkbox "Present"
  - Koma di field Technologies
  - Nomor telepon format lokal
  - Skor kelengkapan tampil
  - Update state tidak saling menimpa
  - Input bulan/tahun dan field Professional Title
- [x] Pipeline PDF server dihapus, begitu juga `/api/enhance`, `/pdf-render`, template HTML lama, dan 7 dependency
- [x] Next 14.0.0 → 14.2.35

### Penyimpangan dari rencana awal

- **`libphonenumber-js` batal dipakai** karena menambah ~30 kB gzip di first load. Gantinya cek panjang E.164.
- **Next 14.2.35 masih punya advisory.** Image Optimizer mati dan Server Actions sudah dihapus, tapi DoS di Server Components tetap berlaku. Ini ditangani di milestone 0.5.

### Sisa

- [x] `npm audit fix` tanpa `--force`: advisory produksi turun dari 18 ke 9 (sisanya butuh Next 15, lihat 0.5)
- [x] Hapus referensi puppeteer/chromium di `README.md`, `.env.example`, dan `vercel.json` root (`vercel.json` root juga memanggil script `vercel-build` yang tidak ada)
- [x] Commit, lalu buka PR ke `main`

Yang belum bisa diuji: fitur AI (butuh `GEMINI_API_KEY`), DOCX di Microsoft Word asli, dan HP sungguhan.

## 0.5. Next 15 + React 19 (selesai)

- [x] `react`/`react-dom` di `packages/ui` jadi `peerDependencies`; `overrides` di root memastikan hanya satu React (19.3)
- [x] `next@15.5.27`, `react@19`, `@types/react@19`, `next-themes@0.4`, `eslint-config-next@15`
- [x] `next.config.js` disesuaikan, `dist` paket di-rebuild, type error diperbaiki (mis. `CardTitle`)
- [x] Semua advisory Next tertutup. Sisa 9 advisory (5 high, 4 moderate) ada di tooling Tailwind 3 (`braces`, `postcss-selector-parser`) dan `uuid` milik SDK Google; ditangani saat upgrade Tailwind/SDK.
- [x] Preview kini mengukur lebar container langsung saat mount, tidak hanya menunggu `ResizeObserver`

## T. Jaring pengaman

- [ ] Unit test `format.ts` dan `normalize.ts`, plus fixture migrasi data lama
- [ ] Test ekstraksi teks PDF untuk tiap template dengan set CV contoh: fresh grad, senior, non-IT, nama non-Latin
- [ ] GitHub Actions: type-check, test, build

## R1. Design system & app shell

- [ ] Token warna sebagai CSS variables:

  | Token | Warna |
  |---|---|
  | background | `#0B1020` |
  | surface | `#111827` |
  | border | `#253047` |
  | text | `#F8FAFC` |
  | muted | `#94A3B8` |
  | primary | `#6366F1` |
  | accent | `#A855F7` |
  | success | `#22C55E` |
  | warning | `#F59E0B` |
  | danger | `#EF4444` |

- [ ] Gradient hanya untuk CTA, skor ATS, highlight AI, dan aksen hero. Sisanya flat.
- [ ] Font Plus Jakarta Sans lewat `next/font` (di-self-host saat build), menggantikan `<link>` Google Fonts di `layout.tsx`
- [ ] Komponen dasar app-local di `apps/web/components/ds/`:
  - Button (primary gradient, secondary, outline, ghost)
  - Panel/Card, Input, Textarea, Select, Tabs
  - Chip (netral/sukses/bahaya)
  - ProgressBar, ScoreRing, NavItem, Topbar, EmptyState
- [ ] Tema gelap saja. Toggle dark/light dihapus.
- [ ] Kontras teks minimal WCAG AA; fokus keyboard terlihat di semua komponen
- [ ] Hapus kelas lama (`glass-card`, `gradient-text`, dll.) setelah semua halaman pindah

## R2. Model data v2

- [ ] Schema zod plus field `version`. Data v1 dimigrasi otomatis, dengan `normalizeCVData` sebagai dasarnya.
- [ ] `experience` dan `projects` memakai `bullets[]`. Teks lama dipecah lewat `splitDescription`.
- [ ] Section baru:
  - Sertifikasi: nama, penerbit, tanggal, URL kredensial
  - Bahasa: nama dan level CEFR A1–C2 / Native
  - Tambahan: penghargaan, volunteering, organisasi, publikasi
- [ ] Kontak ditambah GitHub/portfolio
- [ ] Pengaturan CV:
  - **Bahasa isi:** English atau Bahasa Indonesia. Heading dan kata waktu ikut berubah ("Present"/"Sekarang").
  - **Preset region:** Indonesia, US, atau UK/EU. Preset menentukan ukuran kertas (Letter/A4), target jumlah halaman, dan aturan foto.
- [ ] Foto opsional:
  - Di-resize di browser ke ≤512 px; input JPG/PNG maksimal 2 MB
  - Mati secara default untuk preset US dan UK/EU
- [ ] PDF dan DOCX me-render semua section dan pengaturan baru

## R3. Editor workspace

Menggantikan `/builder` dan `/result`.

- [ ] Halaman `/editor`. `/builder` dan `/result` di-redirect ke sini.
- [ ] Layout responsif:

  | Lebar layar | Susunan |
  |---|---|
  | ≥1440 px | Sidebar, form, preview, kolom analisis |
  | 1024–1439 px | Kolom analisis jadi panel yang bisa dilipat |
  | <1024 px | Tab Form / Preview / Analisis |

- [ ] Topbar berisi:
  - Judul CV yang bisa diedit
  - Status simpan yang jujur, misalnya "Tersimpan di perangkat ini · 2 menit lalu"
  - Tombol Analisis ATS
  - Menu Export: PDF, DOCX, backup JSON, serta "Bagikan file" lewat Web Share API kalau browser mendukung
  - Import JSON
- [ ] Sidebar berisi daftar section dengan tanda ✓ kalau sudah terisi, plus grup AI Tools: Analisis ATS, Job Match, AI Assistant
- [ ] Form per section:
  - Informasi Pribadi (dengan foto)
  - Pengalaman (editor bullet yang bisa diurutkan)
  - Pendidikan, Keahlian (chip per kategori), Proyek
  - Sertifikasi, Bahasa, Tambahan
- [ ] Navigasi Sebelumnya/Selanjutnya dan validasi inline di form
- [ ] Panel preview:
  - Tab Preview menampilkan PDF asli (`PdfPreview`) dan jumlah halaman
  - Tab Template menampilkan pemilih template dengan thumbnail
- [ ] Label terhubung ke input; semua bisa dioperasikan dengan keyboard
- [ ] Semua perilaku Fase 0 tetap jalan: migrasi data lama, export, dan preview

## R4. Analisis ATS & Job Match

Deterministik, tanpa AI, berjalan di browser.

- [ ] Fungsi murni di `apps/web/lib/cv/analysis/`, dengan unit test
- [ ] Komponen skor:

  | Komponen | Yang dicek |
  |---|---|
  | Kelengkapan | Kontak, ringkasan, pengalaman/pendidikan, keahlian |
  | Format & Struktur | Satu kolom, heading standar, tanggal lengkap, jumlah halaman vs preset, foto vs region |
  | Keterbacaan | Panjang bullet dan kalimat, kata ganti "I"/"saya", konsistensi tense |
  | Kualitas Konten | Bullet diawali action verb, ada metrik, frasa lemah ("responsible for"), buzzword, duplikasi |
  | Keyword Match | Hanya muncul kalau user mengisi job description |

- [ ] Setiap skor punya daftar temuan "kenapa skornya segini" plus saran perbaikan. Skornya diberi label "estimasi GenCV".
- [ ] Job Match:
  - User paste job description
  - Keyword diekstrak dengan kamus skill (termasuk frasa seperti "CI/CD"), stopword EN/ID, dan normalisasi sinonim
  - Hasilnya persentase cocok, keyword yang cocok, dan keyword yang belum ada
  - Job description disimpan per CV
- [ ] Ringkasan tampil di kolom kanan editor, versi lengkapnya di panel Analisis ATS dan Job Match
- [ ] `calculateCVScore` lama (yang menghitung jumlah karakter) dihapus

## R5. Landing page

- [ ] Struktur halaman:
  1. Hero
  2. "Dibuat untuk diterima kerja"
  3. Editor
  4. ATS Analyzer
  5. Job Matcher
  6. AI Writing Assistant
  7. Template
  8. Cara kerja (Build → Optimize → Apply)
  9. FAQ
  10. CTA
  11. Footer
- [ ] Visual hero memakai output produk asli. CV dirender dari template sungguhan lewat script build menjadi gambar WebP, supaya landing tidak perlu memuat react-pdf. Kartu skor dihitung dengan engine R4 dari data contoh.
- [ ] Contoh AI sebelum/sesudah memakai placeholder, bukan angka karangan
- [ ] Menu: Beranda, Template, Fitur. Masuk, Harga, dan Blog disembunyikan sampai fiturnya ada.
- [ ] Section social proof palsu dihapus; metadata SEO dan gambar OG diperbarui

## R6. Template & galeri

- [ ] 6 template: Professional, Minimal, Executive, Tech, Academic, Creative. Tiga template yang ada dipetakan ke nama baru.
- [ ] Halaman `/templates` dengan thumbnail asli hasil render, plus filter berdasarkan role dan region
- [ ] Label ATS kualitatif berdasarkan properti nyata (satu kolom, tanpa foto, teks asli), tanpa persentase karangan
- [ ] "Direkomendasikan untuk kamu" berbasis aturan, dari headline dan preset region

## R7. Dashboard multi-CV

- [ ] Banyak CV per perangkat: buat, duplikat ("sesuaikan untuk lowongan lain"), ganti nama, hapus
- [ ] Migrasi otomatis dari key lama `cv-data`
- [ ] Tiap CV menyimpan job description dan hasil Job Match sendiri

## R8. AI Assistant

- [ ] Satu modul AI di server (`@google/genai`) dengan output JSON sesuai schema v2. `packages/lib-ai` dan integrasi lain dihapus.
- [ ] Prompt:
  - Pakai action verb, tanpa kata ganti
  - Tidak boleh menambah fakta; pakai placeholder untuk metrik
  - Ada parameter bahasa output (en-US, en-GB, id)
- [ ] Keyword yang belum ada dari Job Match hanya disarankan kalau user mengonfirmasi memang punya pengalaman itu
- [ ] UI copilot: saran per bullet dan per ringkasan, tampilan sebelum/sesudah, terima atau tolak. Isi CV tidak ditimpa otomatis.
- [ ] Role diambil dari headline, bukan hardcode "Software Developer"
- [ ] Keamanan dan privasi:
  - Rate limit, batas panjang input, dan Turnstile di `/api/ai`
  - Berhenti me-log isi CV
  - Kebijakan privasi yang menjelaskan data dikirim ke Google; pakai Gemini tier berbayar

## C. Bersih-bersih repo

- [ ] Hapus scaffold bolt.new di root: `app/`, `components/`, `hooks/`, `lib/`, `next.config.js`, `tailwind.config.ts`, `components.json`, `.bolt/`
- [ ] Paket dipakai langsung dari source: hapus `dist/` yang di-commit dan `.d.ts` buatan tangan, termasuk `apps/web/declarations.d.ts`
- [ ] Tulis ulang README dan aktifkan ESLint saat build
- [ ] Visual regression dengan Playwright

## Sengaja belum dibuat

- **Akun dan sinkronisasi cloud (Masuk), Harga/pembayaran, Blog.** Semuanya butuh backend, autentikasi, dan payment. Sampai siap, menunya tidak ditampilkan.

## Catatan terhadap mockup

1. **Contoh AI Suggestion di mockup mengarang angka.** "Developed a web application for internal use" diubah menjadi "...used by 10K+ users, improving operational efficiency by 40%". Angka itu tidak ada di teks asal, dan inilah yang ingin dicegah. Versi yang benar: "Built and deployed a web application used by [jumlah] users, improving [metrik] by [X%]", lalu user mengisi angka aslinya.
2. **Foto di CV.** Lazim di Indonesia, tapi dihindari untuk lamaran ke US/UK dan tidak dibaca ATS. Jadi foto opsional dan mengikuti preset region.
3. **"Sekarang" di CV berbahasa Inggris.** Seharusnya "Present". Kata ini mengikuti bahasa isi CV.
4. **Klaim "lolos ATS".** Tidak ada jaminan lolos karena tiap ATS berbeda. Usulan: "ramah ATS", dan skor diberi label estimasi.
5. **Angka di landing page** adalah contoh dan diberi label begitu. Angka di dalam produk selalu dihitung dari data user (R4).
6. **Persentase "ATS Compatibility" per template** diganti label kualitatif.
7. **Skill sebagai chip di CV** aman selama teksnya teks asli. Template paling konservatif tetap memakai daftar dipisah koma.

## Catatan teknis react-pdf 4.9

Semuanya sudah ditangani di `apps/web/lib/cv/pdf/document.tsx`.

- `lineHeight` tanpa satuan dihitung dari `fontSize` milik node itu sendiri (default 18). Karena itu setiap style teks menyetel keduanya bersamaan.
- `lineHeight` yang diwarisi membuat teks `render` (nomor halaman) hilang.
- `minPresenceAhead` diabaikan untuk anak pertama. Judul section ditahan bersama entri pertamanya dengan blok `wrap={false}`.
- Hyphenation dimatikan supaya keyword tidak terpotong di akhir baris.

## Keputusan (disetujui 6 Oktober 2026)

1. Urutan roadmap: 0 → 0.5 → T → R1 → R2 → R3 → R4 → R5 → R6 → R7 → R8 → C
2. Fase 0 di-commit dan dibuka PR
3. Foto opsional, mati default untuk preset internasional
4. Contoh AI di landing memakai placeholder
5. Copy "lolos ATS" diganti "ramah ATS"
6. Masuk, Harga, dan Blog disembunyikan sampai fiturnya ada
7. Tema gelap saja
8. UI berbahasa Indonesia; isi CV bisa English atau Bahasa Indonesia
9. Preset region prioritas: **Indonesia + US** (UK/EU menyusul)
