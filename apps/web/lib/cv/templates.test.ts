import { describe, expect, it } from 'vitest';
import { buildCvView, orderSectionsForTemplate } from './format';
import { normalizeCV } from './normalize';
import { recommendTemplate, toTemplateId } from './templates';

describe('templates', () => {
  it('maps legacy template ids from saved drafts', () => {
    expect(toTemplateId('modern')).toBe('professional');
    expect(toTemplateId('classic')).toBe('executive');
    expect(toTemplateId('creative')).toBe('creative');
    expect(toTemplateId('nope')).toBe('professional');
    expect(normalizeCV({ settings: { template: 'classic' } }).settings.template).toBe('executive');
  });

  it('reorders sections for tech and academic templates only', () => {
    const cv = normalizeCV({
      professionalSummary: 'Summary text here.',
      experience: [{ position: 'Dev', company: 'A', bullets: ['Built things'] }],
      education: [{ institution: 'UI', degree: 'BSc' }],
      skills: [{ name: 'Go' }],
      additional: [{ kind: 'publication', title: 'Paper' }],
    });
    const ids = (template: Parameters<typeof orderSectionsForTemplate>[1]) =>
      orderSectionsForTemplate(buildCvView(cv).sections, template).map((s) => s.id);

    expect(ids('professional')).toEqual(['summary', 'experience', 'education', 'skills', 'publication']);
    expect(ids('tech')).toEqual(['summary', 'skills', 'experience', 'education', 'publication']);
    expect(ids('academic')).toEqual(['summary', 'education', 'publication', 'experience', 'skills']);
  });

  it('recommends a template from the headline', () => {
    expect(recommendTemplate('Senior Backend Engineer', 'professional')).toBe('tech');
    expect(recommendTemplate('Dosen Informatika', 'professional')).toBe('academic');
    expect(recommendTemplate('UI/UX Designer', 'professional')).toBe('creative');
    expect(recommendTemplate('Finance Manager', 'professional')).toBe('executive');
    expect(recommendTemplate('', 'fresh')).toBe('minimal');
  });
});
