/** AI credit packs sold through QRIS. One AI request (summary, bullets, skills, …) costs one credit. */
export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'kredit-50', name: 'Starter', credits: 50, price: 10_000 },
  { id: 'kredit-200', name: 'Pencari kerja', credits: 200, price: 29_000 },
  { id: 'kredit-600', name: 'Intensif', credits: 600, price: 69_000 },
];

/** Free AI requests per day for everyone, signed in or not, before credits are needed. */
export const FREE_AI_PER_DAY = 5;

export const findPack = (id: string) => CREDIT_PACKS.find((p) => p.id === id);

export const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
