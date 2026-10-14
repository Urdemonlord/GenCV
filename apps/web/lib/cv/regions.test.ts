import { describe, expect, it } from 'vitest';
import { CV_REGIONS } from './schema';
import { REGION_PRESETS } from './regions';

describe('region presets', () => {
  it('has a preset for every supported region', () => {
    for (const region of CV_REGIONS) {
      expect(REGION_PRESETS[region]).toBeDefined();
    }
    expect(Object.keys(REGION_PRESETS).sort()).toEqual([...CV_REGIONS].sort());
  });

  it('only the US uses Letter paper', () => {
    for (const region of CV_REGIONS) {
      expect(REGION_PRESETS[region].paper).toBe(region === 'us' ? 'LETTER' : 'A4');
    }
  });

  it('allows photos only where local conventions accept them', () => {
    expect(REGION_PRESETS.id.allowPhoto).toBe(true);
    for (const region of ['us', 'uk', 'eu'] as const) {
      expect(REGION_PRESETS[region].allowPhoto).toBe(false);
      // A disabled photo field needs a reason to show the user.
      expect(REGION_PRESETS[region].photoNote).toBeTruthy();
    }
  });

  it('caps bullets tighter for one-page regions', () => {
    for (const region of CV_REGIONS) {
      const preset = REGION_PRESETS[region];
      if (preset.pageTarget === 1) expect(preset.maxBullets).toBeLessThanOrEqual(20);
      else expect(preset.maxBullets).toBeGreaterThan(20);
    }
  });
});
