/**
 * Word lists for the rule-based CV analysis. Kept deliberately small and readable: every
 * rule must be explainable to the user ("this bullet starts with a weak phrase").
 */

/** Strong action verbs that should open an achievement bullet (EN + ID). */
export const ACTION_VERBS = new Set(
  `
achieved accelerated administered advised analyzed analysed architected assessed audited automated boosted built
championed coached collaborated completed conducted configured consolidated coordinated created cut debugged decreased
defined delivered deployed designed developed devised diagnosed directed doubled drove edited eliminated enabled
engineered enhanced established evaluated executed expanded facilitated forecast founded generated grew guided halved
handled headed identified implemented improved increased initiated innovated installed instructed integrated introduced
launched led lowered maintained managed mentored merged migrated minimized modernized monitored negotiated optimized
orchestrated organized oversaw owned partnered piloted pioneered planned prepared presented prioritized produced
programmed proposed prototyped published raised rebuilt redesigned reduced refactored resolved restructured revamped
saved scaled secured shipped simplified solved spearheaded standardized streamlined strengthened supervised supported
surpassed taught tested tracked trained transformed tripled troubleshot unified upgraded validated won wrote
memimpin membangun mengembangkan merancang meningkatkan menurunkan mengurangi mengoptimalkan mengotomatisasi menerapkan
mengimplementasikan meluncurkan mengelola mengoordinasikan menganalisis menyusun membuat mendesain menghemat mempercepat
menyelesaikan melatih membimbing menginisiasi memigrasikan menyederhanakan memperbaiki merintis mendirikan menjual
menegosiasikan mempresentasikan meneliti menguji menulis memimpin mencapai menaikkan menggandakan
`
    .split(/\s+/)
    .filter(Boolean)
);

/** Openers that describe duties instead of results. */
export const WEAK_OPENERS = [
  'responsible for',
  'in charge of',
  'duties included',
  'tasked with',
  'worked on',
  'helped',
  'assisted',
  'participated in',
  'involved in',
  'bertanggung jawab',
  'bertugas',
  'membantu',
  'ikut serta',
  'terlibat dalam',
];

/** Self-descriptions recruiters skip; show evidence instead. */
export const BUZZWORDS = [
  'hardworking',
  'hard-working',
  'team player',
  'go-getter',
  'self-motivated',
  'detail-oriented',
  'results-driven',
  'passionate',
  'dynamic',
  'synergy',
  'think outside the box',
  'fast learner',
  'pekerja keras',
  'cepat belajar',
  'berdedikasi tinggi',
  'mampu bekerja di bawah tekanan',
];

/** First-person pronouns: CVs use implied first person ("Led…", not "I led…"). */
export const PRONOUNS = /\b(i|me|my|mine|saya|aku|ku)\b/i;

/**
 * Skills and terms recognised in job ads. Multi-word entries are matched as phrases.
 * Lower-case; synonyms are folded by SYNONYMS below.
 */
export const SKILL_TERMS: string[] = (
  'javascript, typescript, python, java, kotlin, swift, golang, rust, c++, c#, php, ruby, scala, matlab, ' +
  'sql, nosql, html, css, sass, react, react native, next.js, vue, angular, svelte, node.js, express, ' +
  'nestjs, django, flask, fastapi, spring, laravel, rails, .net, graphql, rest api, grpc, microservices, ' +
  'serverless, docker, kubernetes, terraform, ansible, jenkins, github actions, gitlab ci, ci/cd, aws, ' +
  'azure, gcp, firebase, supabase, linux, bash, git, postgresql, mysql, mongodb, redis, elasticsearch, ' +
  'kafka, rabbitmq, spark, hadoop, airflow, dbt, snowflake, bigquery, databricks, tableau, power bi, ' +
  'looker, excel, google sheets, machine learning, deep learning, nlp, computer vision, tensorflow, ' +
  'pytorch, scikit-learn, pandas, numpy, statistics, data analysis, data visualization, data modeling, ' +
  'etl, a/b testing, forecasting, figma, sketch, photoshop, illustrator, after effects, ui design, ' +
  'ux design, user research, prototyping, wireframing, design systems, accessibility, seo, sem, ' +
  'google analytics, google ads, meta ads, content marketing, copywriting, email marketing, ' +
  'social media marketing, crm, salesforce, hubspot, b2b, b2c, lead generation, account management, ' +
  'negotiation, project management, product management, agile, scrum, kanban, jira, confluence, ' +
  'stakeholder management, roadmapping, okrs, financial modeling, accounting, budgeting, ifrs, psak, ' +
  'audit, tax, payroll, sap, erp, procurement, supply chain, logistics, inventory management, ' +
  'quality assurance, unit testing, test automation, selenium, cypress, playwright, penetration testing, ' +
  'iso 27001, networking, customer service, sales, recruitment, public speaking, leadership, ' +
  'communication, problem solving, english, mandarin, japanese'
)
  .split(', ')
  .map((term) => term.trim())
  .filter(Boolean);

export const SYNONYMS: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  nodejs: 'node.js',
  node: 'node.js',
  reactjs: 'react',
  'react.js': 'react',
  nextjs: 'next.js',
  vuejs: 'vue',
  k8s: 'kubernetes',
  postgres: 'postgresql',
  'google cloud platform': 'gcp',
  'amazon web services': 'aws',
  ml: 'machine learning',
  'ci / cd': 'ci/cd',
  cicd: 'ci/cd',
  'continuous integration': 'ci/cd',
  powerbi: 'power bi',
  'ms excel': 'excel',
  'microsoft excel': 'excel',
  'restful api': 'rest api',
  'rest apis': 'rest api',
  'restful apis': 'rest api',
  ux: 'ux design',
  ui: 'ui design',
};
