export const TEMPLATE_IDS = ['modern', 'classic', 'creative'] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export function toTemplateId(value: string | undefined): TemplateId {
  return TEMPLATE_IDS.find((id) => id === value) ?? 'modern';
}
