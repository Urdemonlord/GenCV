import Image from 'next/image';

/**
 * Art hero portal Ayo Kerja — dipakai SAMA oleh hero /lowongan dan hero
 * Beranda, supaya keduanya persis mockup: burst biru (clip-path 16 titik,
 * rotate -5deg), ilustrasi megaphone halftone biru yang dipotong dari
 * elemen-desain.png (bukan emoji), 3 garis suara segitiga biru di kiri
 * megaphone, dan 3 art-tag. Ukuran mengikuti mockup index.html: burst
 * 260x220 desktop / 175x150 mobile, megaphone 180px / 125px (diperbesar
 * mengikuti rasio screenshot mockup; kode index.html menulis 118px tapi
 * ilustrasi di screenshot lebih besar), rotate -15deg.
 */
export function HeroArt() {
  return (
    <div
      aria-hidden="true"
      className="relative flex min-h-[190px] items-center justify-center lg:min-h-[245px]"
    >
      <div className="relative h-[150px] w-[175px] lg:h-[220px] lg:w-[260px]">
        {/* Burst biru di belakang megaphone. */}
        <div
          className="absolute inset-0 bg-primary"
          style={{
            clipPath:
              'polygon(50% 0,60% 25%,84% 8%,78% 35%,100% 42%,77% 57%,91% 83%,63% 76%,50% 100%,38% 76%,9% 88%,23% 59%,0 44%,25% 34%,16% 9%,41% 25%)',
            transform: 'rotate(-5deg)',
          }}
        />
        {/* 3 garis suara segitiga biru di kiri megaphone, seperti screenshot mockup. */}
        <div
          className="absolute -left-[36px] top-[16%] h-[13px] w-[40px] -rotate-[26deg] bg-primary lg:-left-[44px] lg:top-[18%] lg:h-[15px] lg:w-[48px]"
          style={{ clipPath: 'polygon(0 50%, 100% 0, 100% 100%)' }}
        />
        <div
          className="absolute -left-[42px] top-[38%] h-[13px] w-[44px] bg-primary lg:-left-[50px] lg:top-[40%] lg:h-[15px] lg:w-[52px]"
          style={{ clipPath: 'polygon(0 50%, 100% 0, 100% 100%)' }}
        />
        <div
          className="absolute -left-[36px] top-[60%] h-[13px] w-[40px] rotate-[26deg] bg-primary lg:-left-[44px] lg:top-[62%] lg:h-[15px] lg:w-[48px]"
          style={{ clipPath: 'polygon(0 50%, 100% 0, 100% 100%)' }}
        />
        {/* Megaphone halftone biru (apps/web/public/megaphone.png, 336x377). */}
        <Image
          src="/megaphone.png"
          alt=""
          aria-hidden="true"
          width={336}
          height={377}
          priority
          className="absolute left-1/2 top-1/2 z-[1] h-[125px] w-auto lg:h-[180px]"
          style={{
            transform: 'translate(-50%, -50%) rotate(-15deg)',
            filter: 'drop-shadow(7px 8px 0 rgba(0,0,0,.18))',
          }}
        />
      </div>
      <div className="absolute right-0 top-0 z-[2] grid gap-3 lg:top-[25px]">
        <div className="rotate-[-4deg] rounded-md border-2 border-primary bg-white px-3 py-2 text-[10px] font-black text-primary shadow-[3px_3px_0_#0035AD] lg:text-sm lg:shadow-[5px_5px_0_#0035AD]">
          ✓ Cari lowongan
        </div>
        <div className="rotate-[2deg] rounded-md border-2 border-primary bg-white px-3 py-2 text-[10px] font-black text-primary shadow-[3px_3px_0_#0035AD] lg:text-sm lg:shadow-[5px_5px_0_#0035AD]">
          ✓ Cocokkan dengan CV
        </div>
        <div className="rotate-[-2deg] rounded-md border-2 border-primary bg-white px-3 py-2 text-[10px] font-black text-primary shadow-[3px_3px_0_#0035AD] lg:text-sm lg:shadow-[5px_5px_0_#0035AD]">
          ✓ Kembangkan karier
        </div>
      </div>
    </div>
  );
}
