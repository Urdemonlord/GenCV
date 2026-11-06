import { HUNTER_FEED_URL, parseHunterJobs, type HunterParseResult } from './hunter';

/** Feed ditulis cron harian; cache satu jam cukup segar dan menghemat request ke GitHub. */
const FEED_REVALIDATE_SECONDS = 3600;

/**
 * Ambil feed hunter di server, supaya /lowongan dikirim dengan daftar lowongan sudah
 * ada di HTML (bisa diindeks mesin pencari, tampil tanpa menunggu JavaScript).
 * Null bila feed tidak terjangkau atau kosong: halaman lalu mencoba lagi dari browser.
 */
export async function fetchHunterFeed(): Promise<HunterParseResult | null> {
  try {
    const response = await fetch(HUNTER_FEED_URL, { next: { revalidate: FEED_REVALIDATE_SECONDS } });
    if (!response.ok) return null;
    const result = parseHunterJobs(await response.json());
    return result.jobs.length > 0 ? result : null;
  } catch {
    return null;
  }
}
