import type { ComponentType } from 'react';
import {
  Award,
  BadgeCheck,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Languages,
  Settings2,
  TextQuote,
  User,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { CV } from '@/lib/cv/schema';
import { EducationSection } from './education';
import { ExperienceSection } from './experience';
import { AdditionalSection, CertificationsSection, LanguagesSection } from './extras';
import { PersonalSection } from './personal';
import { ProjectsSection } from './projects';
import { SetupSection } from './setup';
import type { SectionProps } from './shared';
import { SkillsSection } from './skills';
import { SummarySection } from './summary';

export interface EditorSection {
  id: string;
  label: string;
  icon: LucideIcon;
  component: ComponentType<SectionProps>;
  optional?: boolean;
  /** Shown as a check mark in the sidebar. */
  isComplete: (cv: CV) => boolean;
}

const filled = (value: string) => value.trim() !== '';

export const EDITOR_SECTIONS: EditorSection[] = [
  { id: 'setup', label: 'Pengaturan', icon: Settings2, component: SetupSection, isComplete: () => true },
  {
    id: 'personal',
    label: 'Informasi pribadi',
    icon: User,
    component: PersonalSection,
    isComplete: ({ personalInfo: p }) => [p.fullName, p.email, p.phone, p.location].every(filled),
  },
  { id: 'summary', label: 'Ringkasan', icon: TextQuote, component: SummarySection, isComplete: (cv) => filled(cv.professionalSummary) },
  {
    id: 'experience',
    label: 'Pengalaman kerja',
    icon: Briefcase,
    component: ExperienceSection,
    isComplete: (cv) => cv.experience.some((e) => filled(e.position) && e.bullets.some(filled)),
  },
  { id: 'education', label: 'Pendidikan', icon: GraduationCap, component: EducationSection, isComplete: (cv) => cv.education.some((e) => filled(e.institution)) },
  { id: 'skills', label: 'Keahlian', icon: Wrench, component: SkillsSection, isComplete: (cv) => cv.skills.length >= 3 },
  { id: 'projects', label: 'Proyek', icon: FolderGit2, component: ProjectsSection, optional: true, isComplete: (cv) => cv.projects.some((p) => filled(p.name)) },
  {
    id: 'certifications',
    label: 'Sertifikasi',
    icon: BadgeCheck,
    component: CertificationsSection,
    optional: true,
    isComplete: (cv) => cv.certifications.some((c) => filled(c.name)),
  },
  { id: 'languages', label: 'Bahasa', icon: Languages, component: LanguagesSection, optional: true, isComplete: (cv) => cv.languages.some((l) => filled(l.name)) },
  { id: 'additional', label: 'Tambahan', icon: Award, component: AdditionalSection, optional: true, isComplete: (cv) => cv.additional.some((a) => filled(a.title)) },
];
