# Panduan Deployment Vercel untuk GenCV Monorepo

Dokumen ini menjelaskan cara mengatasi error `Cannot find module ...shared.ts` dan masalah lain terkait deployment monorepo ke Vercel.

## Masalah Umum

1. **Error: Cannot find module ...shared.ts**
   - Penyebab: Node.js di server tidak dapat memproses file TypeScript langsung
   - Solusi: Kompilasi semua package internal ke JavaScript sebelum deployment

2. **Warning: Invalid 'main' field in package.json**
   - Penyebab: Field "main" menunjuk ke file .ts, bukan file .js hasil kompilasi
   - Solusi: Update package.json untuk menunjuk ke file JavaScript hasil build

## Langkah-langkah Perbaikan

### 1. Persiapan

Jalankan script setup untuk menginstall dependensi build dan menyiapkan struktur folder:

```powershell
# PowerShell
.\setup-build.ps1
```

atau 

```bash
# Bash
bash setup-build.sh
```

### 2. Perubahan yang Diterapkan

Script di atas telah melakukan perubahan berikut:

1. **Package.json Updates:**
   - Mengubah "main" dan "types" ke file hasil build (dist/index.js)
   - Menambahkan field "files" untuk menentukan file yang akan digunakan
   - Menambahkan script build dan dev menggunakan tsup

2. **Export Path Updates:**
   - Mengubah export paths di utils package untuk menunjuk ke file JS hasil build

3. **Build Process:**
   - Menambahkan command `build:packages` di root package.json
   - Membuat vercel.json untuk custom build command

### 3. Deployment ke Vercel

1. **Push Perubahan ke Repository:**
   ```bash
   git add .
   git commit -m "Fix: Update package build config for Vercel deployment"
   git push
   ```

2. **Setup di Vercel Dashboard:**
   - Root Directory: `apps/web`
   - Build Command: Akan menggunakan yang ada di vercel.json
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Environment Variables:**
   - Tambahkan environment variables yang diperlukan di Vercel dashboard

### 4. Troubleshooting

Jika masih mengalami masalah:

1. **Periksa Build Logs:**
   - Lihat log build di Vercel untuk mengidentifikasi error

2. **Test Build Locally:**
   ```bash
   npm run clean
   npm run build:packages
   cd apps/web
   npm run build
   ```

3. **Verifikasi Output Folder:**
   - Pastikan folder dist dibuat di setiap package
   - Pastikan file JavaScript (.js, .mjs) dan type definitions (.d.ts) ada di dalam folder dist

## Langkah Selanjutnya

Untuk pengembangan berkelanjutan:

1. Selalu jalankan `npm run build:packages` sebelum deploying ke Vercel
2. Pastikan selalu commit perubahan di package yang dimodifikasi

## Referensi

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Vercel Monorepo Support](https://vercel.com/docs/concepts/monorepos)
- [tsup Documentation](https://github.com/egoist/tsup)
