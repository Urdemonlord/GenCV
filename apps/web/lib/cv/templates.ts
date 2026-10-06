export const TEMPLATE_IDS = ['professional', 'minimal', 'executive', 'tech', 'academic', 'creative'] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

/** Names used before the template set was expanded. */
const LEGACY_IDS: Record<string, TemplateId> = { modern: 'professional', classic: 'executive' };

export function toTemplateId(value: unknown): TemplateId {
  if (typeof value !== 'string') return 'professional';
  return TEMPLATE_IDS.find((id) => id === value) ?? LEGACY_IDS[value] ?? 'professional';
}

export type TemplateAudience = 'tech' | 'business' | 'creative' | 'academic' | 'general';

export interface TemplateInfo {
  name: string;
  description: string;
  audiences: TemplateAudience[];
}

export const TEMPLATE_INFO: Record<TemplateId, TemplateInfo> = {
  professional: {
    name: 'Professional',
    description: 'Sans-serif dengan aksen biru. Aman untuk hampir semua posisi.',
    audiences: ['general', 'business', 'tech'],
  },
  minimal: {
    name: 'Minimal',
    description: 'Hitam-putih tanpa aksen warna. Paling konservatif, cocok untuk fresh graduate.',
    audiences: ['general', 'business'],
  },
  executive: {
    name: 'Executive',
    description: 'Serif, rata tengah, formal. Untuk manajerial, korporat, hukum, dan keuangan.',
    audiences: ['business'],
  },
  tech: {
    name: 'Tech',
    description: 'Keahlian ditaruh di atas dan GitHub/portfolio menonjol. Untuk engineer dan data.',
    audiences: ['tech'],
  },
  academic: {
    name: 'Academic',
    description: 'Serif, pendidikan dan publikasi di atas. Untuk dosen, peneliti, dan beasiswa.',
    audiences: ['academic'],
  },
  creative: {
    name: 'Creative',
    description: 'Header berwarna, tetap satu kolom. Untuk desain, marketing, dan startup.',
    audiences: ['creative'],
  },
};

const RECOMMENDATION_RULES: { template: TemplateId; pattern: RegExp }[] = [
  { template: 'academic', pattern: /\b(lecturer|researcher|professor|phd|postdoc|dosen|peneliti|asisten riset|research assistant)\b/i },
  { template: 'tech', pattern: /\b(engineer|developer|programmer|devops|data (?:scientist|analyst|engineer)|software|backend|frontend|full[- ]?stack|machine learning|qa)\b/i },
  { template: 'creative', pattern: /\b(designer|desainer|ui|ux|marketing|content|copywriter|brand|illustrator|social media)\b/i },
  { template: 'executive', pattern: /\b(manager|director|head|vp|vice president|chief|lead|kepala|manajer|direktur|accountant|akuntan|lawyer|legal|finance)\b/i },
];

/** Rule-based suggestion from the headline; fresh graduates default to the plainest layout. */
export function recommendTemplate(headline: string, experienceLevel: 'fresh' | 'professional'): TemplateId {
  const rule = RECOMMENDATION_RULES.find(({ pattern }) => pattern.test(headline));
  if (rule) return rule.template;
  return experienceLevel === 'fresh' ? 'minimal' : 'professional';
}
