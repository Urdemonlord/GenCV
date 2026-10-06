# GenCV

Workspace untuk membuat, mengoptimalkan, dan menyesuaikan CV dengan lowongan yang dituju. Hasilnya CV satu kolom yang ramah ATS, dalam bahasa Inggris atau Indonesia, untuk lamaran di Indonesia maupun ke luar negeri (format US).

## Fitur

- **Editor**: section standar (pengalaman, pendidikan, keahlian, proyek, sertifikasi, bahasa, dan lain-lain) dengan pratinjau PDF yang sama persis dengan hasil unduhan.
- **Enam template** (Professional, Minimal, Executive, Tech, Academic, Creative). Semuanya satu kolom dengan teks asli.
- **Ekspor** PDF dan DOCX, dibuat langsung di browser. Ada juga backup dan impor JSON.
- **Analisis ATS** berbasis aturan yang bisa dijelaskan: kelengkapan, format, keterbacaan, kualitas konten.
- **Job Match**: keyword dari deskripsi lowongan dibandingkan dengan isi CV.
- **AI Assistant** (Gemini): saran per poin dan ringkasan dengan tampilan sebelum/sesudah. Saran baru masuk ke CV setelah diterima.
- **Banyak CV per perangkat**: satu CV per lowongan, bisa diduplikat untuk lowongan lain.

## Prinsip produk

- Setiap skor dihitung dari data user dan diberi label estimasi. Tidak ada klaim "pasti lolos ATS".
- AI tidak boleh mengarang fakta. Angka yang tidak ada di teks asli diganti placeholder seperti `[X%]`, dan saran yang menyebut skill baru ditolak di server.
- Data CV tersimpan di perangkat user (localStorage). Teks hanya dikirim ke server saat tombol AI ditekan; lihat `/privasi`.

## Menjalankan lokal

Butuh Node.js 18.18 atau lebih baru.

```bash
npm install
cp apps/web/.env.example apps/web/.env.local   # opsional, hanya untuk fitur AI
npm run dev                                     # http://localhost:3000
```

Semua fitur selain AI berjalan tanpa env apa pun.

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server development |
| `npm run build` / `npm start` | Build dan jalankan versi produksi (lint ikut dicek) |
| `npm test` | Unit test (Vitest), termasuk snapshot layout PDF semua template |
| `npm run test:e2e` | Smoke test Playwright (jalankan `npm run build` dulu) |
| `npm run lint` / `npm run type-check` | ESLint dan TypeScript |
| `npm run previews -w @gencv/web` | Render ulang gambar template di `public/previews` |

Setelah mengubah layout PDF dengan sengaja, perbarui snapshot-nya dari folder `apps/web`:

```bash
npx vitest run -u lib/cv/pdf/templates.snapshot.test.tsx
```

## Environment

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `GEMINI_API_KEY` | Untuk AI | Key dari project Gemini API **berbayar**. Kebijakan privasi bergantung pada ketentuan tier berbayar. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Disarankan | Rate limit `/api/ai` yang dibagi semua instance. Tanpa ini, limit hanya per instance. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Opsional | Verifikasi Cloudflare Turnstile di `/api/ai`. Pasang keduanya atau tidak sama sekali. |
| `NEXT_PUBLIC_APP_URL` | Disarankan | Domain publik untuk canonical URL, sitemap, dan Open Graph. Di Vercel, tanpa ini dipakai domain produksi project. |

## Deploy (Vercel)

- Root directory: `apps/web`. PDF dan DOCX dibuat di browser, jadi tidak butuh Chromium di server.
- Isi environment variable di atas di dashboard Vercel.
- Aktifkan **Web Analytics** di tab Analytics project Vercel. Script-nya sudah terpasang; tanpa cookie, dan query string (id CV) dibuang sebelum dikirim.

## Struktur

```
apps/web/
  app/                Halaman (landing, editor, dashboard, templates, privasi) dan route /api/ai
  components/ds/      Komponen design system
  lib/cv/             Schema CV (zod), format, template PDF/DOCX, analisis ATS & Job Match, penyimpanan lokal
  lib/ai/             Kontrak task AI, prompt, guard anti-mengarang, saran
  e2e/                Smoke test Playwright
  public/             Font (Inter, Source Serif 4) dan gambar template
plan.md               Roadmap dan keputusan desain
```

CI (GitHub Actions) menjalankan lint, type-check, unit test, build, dan smoke test di setiap PR.
