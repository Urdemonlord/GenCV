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
- **Artikel** (`/artikel`): panduan CV yang isinya konsisten dengan aturan yang dipakai produk, plus RSS di `/feed.xml`.

## Prinsip produk

- Setiap skor dihitung dari data user dan diberi label estimasi. Tidak ada klaim "pasti lolos ATS".
- AI tidak boleh mengarang fakta. Angka yang tidak ada di teks asli diganti placeholder seperti `[X%]`, dan saran yang menyebut skill baru ditolak di server.
- Data CV tersimpan di perangkat user (localStorage). Teks hanya dikirim ke server saat tombol AI ditekan; lihat `/privasi`.

## Menjalankan lokal

Butuh Node.js 20.19 atau lebih baru.

```bash
npm install
cp apps/web/.env.example apps/web/.env.local   # opsional, hanya untuk fitur AI
npm run dev                                     # http://localhost:3000
```

Semua fitur selain AI berjalan tanpa env apa pun. Sinkronisasi cloud juga opsional: tanpa env di tabel bawah, aplikasi berjalan penuh secara lokal.

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
| `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Opsional | Sinkronisasi cloud. Tanpa ketiganya, aplikasi tetap berjalan penuh di perangkat dan `/api/auth` membalas 503. `BETTER_AUTH_SECRET` minimal 32 karakter (`openssl rand -base64 32`). Postgres harus bisa dijangkau dari Vercel (mis. Neon); socket lokal tidak bisa. |
| `MEOWPAY_HOST`, `MEOWPAY_KEY`, `MEOWPAY_WEBHOOK_SECRET` | Opsional | Jual kredit AI lewat QRIS (panel MeowPay). Butuh juga variabel database/auth di atas. Lihat [Kredit AI](#kredit-ai). |

## Kredit AI

Tanpa variabel `MEOWPAY_*`, AI gratis dengan batas per IP (10/menit, 150/hari). Dengan billing aktif:

- Setiap orang mendapat **5 permintaan AI gratis per hari** (per akun, atau per IP untuk pengunjung). Setelah itu, 1 permintaan = 1 kredit.
  Kredit dipotong sebelum model dipanggil dan dikembalikan jika gagal.
- Paket di `lib/billing/packs.ts`: 50 kredit Rp 10.000, 200 kredit Rp 29.000, 600 kredit Rp 69.000. Dibeli di `/kredit`
  (daftar/masuk dengan email + kata sandi, lalu QRIS).
- Nominal = harga paket. Jika nominal itu sedang dipakai pembeli lain, ada potongan acak ≤1% (maks. Rp 999), tidak pernah lebih mahal.
  Panel harus memakai `MAX_PENDING_PER_AMOUNT=1`.
- Lunas lewat webhook `payment.paid` atau polling halaman (cadangan); idempoten. `payment.reversed` menarik kredit (saldo berhenti di 0).
- Migrasi: `lib/sync/migrations/0002_credit_packs.sql` (tabel `ai_credits`, `credit_payments`).

Setup panel: buat API key (scope `orders:create`, `orders:read`) → `MEOWPAY_KEY`; tambah webhook
`https://<domain>/api/credits/webhook` dengan event `payment.paid`, `payment.expired`, `payment.reversed` → secret ke
`MEOWPAY_WEBHOOK_SECRET`; `MEOWPAY_HOST` = URL panel.

Test integrasi (`lib/billing/credits.integration.test.ts`) memakai Postgres asli lewat `TEST_DATABASE_URL`, seperti test sync.

## Deploy (Vercel)

- Root directory: `apps/web`. PDF dan DOCX dibuat di browser, jadi tidak butuh Chromium di server.
- Isi environment variable di atas di dashboard Vercel.
- Aktifkan **Web Analytics** di tab Analytics project Vercel. Script-nya sudah terpasang; tanpa cookie, dan query string (id CV) dibuang sebelum dikirim.

## Struktur

```
apps/web/
  app/                Halaman (landing, editor, dashboard, templates, artikel, privasi) dan route /api/ai, /feed.xml
  components/ds/      Komponen design system
  lib/cv/             Schema CV (zod), format, template PDF/DOCX, analisis ATS & Job Match, penyimpanan lokal
  lib/ai/             Kontrak task AI, prompt, guard anti-mengarang, saran
  lib/blog/           Data artikel dan pembangun RSS feed
  lib/sync/           Sinkronisasi cloud: rencana merge, skema Drizzle, Better Auth
  e2e/                Smoke test Playwright
  public/             Font (Inter, Source Serif 4) dan gambar template
plan.md               Roadmap dan keputusan desain
```

CI (GitHub Actions) menjalankan lint, type-check, unit test, build, dan smoke test di setiap PR.
