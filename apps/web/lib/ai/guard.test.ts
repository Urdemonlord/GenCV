import { describe, expect, it } from 'vitest';
import { guardText, inventedSkills, replaceInventedNumbers } from './guard';

describe('AI output guard', () => {
  it('replaces numbers that are not in the source with placeholders', () => {
    expect(replaceInventedNumbers('Cut load time by 40% for 10K+ users', 'Made the site faster')).toBe(
      'Cut load time by [X%] for [X] users'
    );
    expect(replaceInventedNumbers('Served 1,200 users and cut cost by 15%', 'had 1200 users, saved 15% cost')).toBe(
      'Served 1,200 users and cut cost by 15%'
    );
  });

  it('keeps numbers that belong to names', () => {
    expect(replaceInventedNumbers('Migrated files to S3 with ES6 modules', 'moved files')).toBe('Migrated files to S3 with ES6 modules');
  });

  it('flags skills the user never mentioned', () => {
    expect(inventedSkills('Built APIs with Python and Kubernetes', 'built apis in python')).toEqual(['kubernetes']);
    expect(inventedSkills('Built APIs with Python and Kubernetes', 'built apis in python', ['Kubernetes'])).toEqual([]);
    expect(guardText('Deployed with Docker', 'deployed the app')).toBeNull();
    expect(guardText('Deployed the app for 300 users', 'deployed the app')).toBe('Deployed the app for [X] users');
  });
});
