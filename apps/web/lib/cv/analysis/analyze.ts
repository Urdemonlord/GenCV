import type { CV } from '../schema';
import { hasPlaceholder } from '@/lib/ai/suggestions';
import { matchKeywords, type KeywordMatch } from './keywords';
import { ACTION_VERBS, BUZZWORDS, PRONOUNS, WEAK_OPENERS } from './lexicon';

export type Severity = 'good' | 'warn' | 'issue';

export interface Finding {
  severity: Severity;
  message: string;
}

export interface ScoreComponent {
  id: 'completeness' | 'format' | 'readability' | 'content' | 'keywords';
  label: string;
  /** 0–100 */
  score: number;
  findings: Finding[];
}

export interface CvAnalysis {
  /** 0–100, an estimate from transparent rules — not a prediction of any specific ATS. */
  overall: number;
  components: ScoreComponent[];
  keywords: KeywordMatch;
}

const filled = (value: string) => value.trim() !== '';
const words = (text: string) => text.trim().split(/\s+/).filter(Boolean);
const pct = (ok: number, total: number) => (total === 0 ? 100 : Math.round((ok / total) * 100));
const quote = (text: string) => `“${text.length > 60 ? `${text.slice(0, 57)}…` : text}”`;

function allBullets(cv: CV): string[] {
  return [...cv.experience.flatMap((e) => e.bullets), ...cv.projects.flatMap((p) => p.bullets)].map((b) => b.trim()).filter(Boolean);
}

function completeness(cv: CV): ScoreComponent {
  const p = cv.personalInfo;
  const checks: [boolean, string][] = [
    [filled(p.fullName), 'Nama lengkap'],
    [filled(p.email), 'Email'],
    [filled(p.phone), 'Nomor telepon'],
    [filled(p.location), 'Lokasi (kota, negara)'],
    [filled(p.headline), 'Profesi / jabatan di bawah nama'],
    [filled(cv.professionalSummary), 'Ringkasan profesional'],
    [
      cv.experienceLevel === 'fresh'
        ? cv.experience.length + cv.projects.length > 0
        : cv.experience.some((e) => filled(e.position)),
      cv.experienceLevel === 'fresh' ? 'Pengalaman, magang, atau proyek' : 'Pengalaman kerja',
    ],
    [cv.education.some((e) => filled(e.institution)), 'Pendidikan'],
    [cv.skills.length >= 5, 'Minimal 5 keahlian'],
  ];
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  return {
    id: 'completeness',
    label: 'Kelengkapan',
    score: pct(checks.length - missing.length, checks.length),
    findings: missing.length
      ? missing.map((label) => ({ severity: 'issue' as const, message: `Belum ada: ${label}.` }))
      : [{ severity: 'good', message: 'Semua bagian utama sudah terisi.' }],
  };
}

function format(cv: CV): ScoreComponent {
  const findings: Finding[] = [];
  let checks = 0;
  let passed = 0;
  const check = (ok: boolean, issue: Finding) => {
    checks++;
    if (ok) passed++;
    else findings.push(issue);
  };

  for (const exp of cv.experience.filter((e) => filled(e.position) || filled(e.company))) {
    check(filled(exp.startDate) && (exp.current || filled(exp.endDate)), {
      severity: 'warn',
      message: `Tanggal belum lengkap di ${quote(exp.position || exp.company)}. ATS memakai tanggal untuk menghitung lama pengalaman.`,
    });
    check(filled(exp.company) && filled(exp.position), {
      severity: 'warn',
      message: `Lengkapi posisi dan nama perusahaan di ${quote(exp.position || exp.company)}.`,
    });
  }

  const bulletCount = allBullets(cv).length;
  if (cv.settings.region === 'us') {
    check(bulletCount <= 18, {
      severity: 'warn',
      message: `${bulletCount} poin pencapaian; untuk lamaran ke AS biasanya CV 1 halaman. Pilih poin yang paling relevan.`,
    });
  } else {
    check(bulletCount <= 30, { severity: 'warn', message: `${bulletCount} poin pencapaian; usahakan CV maksimal 2 halaman.` });
  }

  check(!(cv.settings.showPhoto && cv.personalInfo.photo && cv.settings.region !== 'us'), {
    severity: 'warn',
    message: 'Foto tidak dibaca ATS dan sebaiknya dihilangkan untuk lamaran ke perusahaan multinasional.',
  });

  if (!findings.length) {
    findings.push({ severity: 'good', message: 'Template satu kolom dengan teks asli dan judul section standar, aman untuk ATS.' });
  }
  return { id: 'format', label: 'Format & struktur', score: pct(passed, checks), findings };
}

function readability(cv: CV): ScoreComponent {
  const findings: Finding[] = [];
  const bullets = allBullets(cv);
  let passed = 0;

  for (const bullet of bullets) {
    const count = words(bullet).length;
    if (count > 35) findings.push({ severity: 'warn', message: `Poin terlalu panjang (${count} kata): ${quote(bullet)}. Idealnya 1–2 baris.` });
    else if (count < 4) findings.push({ severity: 'warn', message: `Poin terlalu singkat: ${quote(bullet)}. Jelaskan apa yang dicapai.` });
    else if (PRONOUNS.test(bullet)) findings.push({ severity: 'warn', message: `Hindari kata ganti orang pertama: ${quote(bullet)}.` });
    else passed++;
  }

  const summaryWords = words(cv.professionalSummary).length;
  let summaryOk = 1;
  if (summaryWords > 90) {
    summaryOk = 0;
    findings.push({ severity: 'warn', message: `Ringkasan ${summaryWords} kata; idealnya 40–80 kata.` });
  } else if (summaryWords > 0 && PRONOUNS.test(cv.professionalSummary)) {
    summaryOk = 0;
    findings.push({ severity: 'warn', message: 'Ringkasan memakai kata ganti orang pertama ("I", "saya"). Tulis tanpa subjek.' });
  }

  if (!findings.length) findings.push({ severity: 'good', message: 'Panjang poin dan ringkasan sudah pas.' });
  return { id: 'readability', label: 'Keterbacaan', score: pct(passed + summaryOk, bullets.length + 1), findings };
}

function content(cv: CV): ScoreComponent {
  const findings: Finding[] = [];
  const bullets = allBullets(cv);
  if (!bullets.length) {
    return {
      id: 'content',
      label: 'Kualitas konten',
      score: 0,
      findings: [{ severity: 'issue', message: 'Belum ada poin pencapaian di pengalaman atau proyek.' }],
    };
  }

  let points = 0;
  const firstWords = new Map<string, number>();
  for (const bullet of bullets) {
    const lower = bullet.toLowerCase();
    const first = lower.split(/[\s,]+/)[0] ?? '';
    firstWords.set(first, (firstWords.get(first) ?? 0) + 1);
    const weak = WEAK_OPENERS.find((phrase) => lower.startsWith(phrase));
    const strong = ACTION_VERBS.has(first);
    // An unfilled AI placeholder such as [X%] is not a metric yet.
    const metric = /\d/.test(bullet) && !hasPlaceholder(bullet);

    if (weak) findings.push({ severity: 'warn', message: `Diawali frasa tugas "${weak}": ${quote(bullet)}. Tulis hasilnya, mis. "Meningkatkan…".` });
    else if (!strong) findings.push({ severity: 'warn', message: `Awali dengan kata kerja aktif: ${quote(bullet)}.` });
    if (!metric) findings.push({ severity: 'warn', message: `Tambahkan angka nyata (jumlah, %, waktu) bila ada: ${quote(bullet)}.` });
    points += (strong && !weak ? 0.6 : 0) + (metric ? 0.4 : 0);
  }

  for (const [verb, count] of firstWords) {
    if (count >= 4 && verb) findings.push({ severity: 'warn', message: `"${verb}" membuka ${count} poin; variasikan kata kerjanya.` });
  }

  const text = [cv.professionalSummary, ...bullets].join(' ').toLowerCase();
  for (const buzzword of BUZZWORDS) {
    if (text.includes(buzzword)) findings.push({ severity: 'warn', message: `Klise "${buzzword}"; tunjukkan buktinya lewat pencapaian.` });
  }

  const quantified = bullets.filter((b) => /\d/.test(b) && !hasPlaceholder(b)).length;
  findings.unshift({
    severity: quantified / bullets.length >= 0.5 ? 'good' : 'warn',
    message: `${quantified} dari ${bullets.length} poin memuat angka.`,
  });
  const unfilled = [cv.professionalSummary, ...bullets].filter(hasPlaceholder);
  if (unfilled.length) {
    findings.unshift({
      severity: 'issue',
      message: `${unfilled.length} teks masih memuat placeholder seperti [X%]: ${quote(unfilled[0])}. Isi dengan angka asli atau hapus sebelum mengirim CV.`,
    });
  }
  return { id: 'content', label: 'Kualitas konten', score: Math.round((points / bullets.length) * 100), findings };
}

const WEIGHTS: Record<ScoreComponent['id'], number> = {
  completeness: 0.25,
  format: 0.15,
  readability: 0.2,
  content: 0.25,
  keywords: 0.15,
};

export function analyzeCv(cv: CV): CvAnalysis {
  const keywords = matchKeywords(cv, cv.jobDescription);
  const components = [completeness(cv), format(cv), readability(cv), content(cv)];
  if (keywords.score !== null) {
    components.push({
      id: 'keywords',
      label: 'Kecocokan keyword',
      score: keywords.score,
      findings: keywords.missing.length
        ? [{ severity: 'warn', message: `Belum disebut: ${keywords.missing.join(', ')}. Tambahkan hanya jika memang kamu kuasai.` }]
        : [{ severity: 'good', message: 'Semua keyword keahlian dari lowongan sudah muncul di CV.' }],
    });
  }
  const totalWeight = components.reduce((sum, c) => sum + WEIGHTS[c.id], 0);
  const overall = Math.round(components.reduce((sum, c) => sum + c.score * WEIGHTS[c.id], 0) / totalWeight);
  return { overall, components, keywords };
}

export function scoreLabel(score: number): string {
  if (score >= 85) return 'Sangat baik';
  if (score >= 70) return 'Baik';
  if (score >= 50) return 'Cukup';
  return 'Perlu perbaikan';
}
