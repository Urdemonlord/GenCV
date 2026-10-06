import { normalizeCV } from './cv/normalize';

/**
 * Fictional example used for the landing page and template thumbnails. Every number on the
 * landing page is computed from this data by the real analysis engine.
 */
export const SAMPLE_CV = normalizeCV({
  title: 'CV Software Engineer',
  experienceLevel: 'professional',
  personalInfo: {
    fullName: 'Arya Pratama',
    headline: 'Software Engineer',
    email: 'arya.pratama@email.com',
    phone: '+62 812 3456 7890',
    location: 'Semarang, Indonesia',
    linkedIn: 'linkedin.com/in/aryapratama',
    github: 'github.com/aryapratama',
  },
  professionalSummary:
    'Software engineer with 4 years of experience building web platforms in Go and TypeScript. Shipped payment and logistics features used by thousands of merchants, with a focus on reliability and clean APIs.',
  experience: [
    {
      position: 'Software Engineer',
      company: 'PT Kirim Cepat',
      location: 'Semarang, Indonesia',
      startDate: '2023-02',
      current: true,
      bullets: [
        'Built a shipment-tracking service in Go and PostgreSQL handling 2M requests per day',
        'Cut API p95 latency by 45% by introducing Redis caching and query indexes',
        'Led migration of 6 services to Docker and CI/CD pipelines, reducing release time from 2 days to 2 hours',
      ],
    },
    {
      position: 'Web Developer (Freelance)',
      company: 'Various clients',
      location: 'Remote',
      startDate: '2021-06',
      endDate: '2023-01',
      bullets: [
        'Delivered 9 web applications in Next.js and TypeScript for small businesses',
        'Automated invoicing for a retail client, saving 15 hours of manual work per month',
        'Maintained client websites and handled hosting and domain setup',
      ],
    },
  ],
  education: [
    {
      institution: 'Universitas Diponegoro',
      degree: 'Bachelor of Computer Science',
      field: '',
      location: 'Semarang',
      startDate: '2017-08',
      endDate: '2021-07',
      gpa: '3.68/4.00',
    },
  ],
  skills: ['Go', 'TypeScript', 'PostgreSQL', 'Docker', 'Next.js', 'Redis'].map((name) => ({ name, category: 'Technical' })),
  languages: [
    { name: 'Indonesian', level: 'Native' },
    { name: 'English', level: 'C1' },
  ],
  certifications: [{ name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: '2024-03' }],
});

export const SAMPLE_JOB_AD =
  'Backend Engineer. Requirements: Golang, PostgreSQL, Docker, Kubernetes, CI/CD, REST APIs and microservices. Experience with Redis is a plus.';
