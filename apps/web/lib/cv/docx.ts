import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  Tab,
  TabStopType,
  TextRun,
} from 'docx';
import type { CVData } from '@cv-generator/types';
import { SECTION_TITLES, buildCvView, type ContactItem, type CvView, type EntryView, type SectionId } from './format';
import type { TemplateId } from './templates';

// A4 in twentieths of a point.
const PAGE = { width: 11906, height: 16838, marginX: 850, marginY: 720 };
const CONTENT_WIDTH = PAGE.width - PAGE.marginX * 2;
const BULLETS = 'cv-bullets';

interface DocxTheme {
  font: string;
  accent: string;
  muted: string;
  centered: boolean;
}

const THEMES: Record<TemplateId, DocxTheme> = {
  modern: { font: 'Calibri', accent: '1D4ED8', muted: '4B5563', centered: false },
  classic: { font: 'Georgia', accent: '111827', muted: '374151', centered: true },
  creative: { font: 'Calibri', accent: '6D28D9', muted: '4B5563', centered: false },
};

const link = (text: string, href: string) =>
  new ExternalHyperlink({ link: href, children: [new TextRun({ text, style: 'Hyperlink' })] });

function contactRuns(contacts: ContactItem[], theme: DocxTheme) {
  return contacts.flatMap((contact, index) => [
    ...(index > 0 ? [new TextRun({ text: '  |  ', color: theme.muted })] : []),
    contact.href ? link(contact.text, contact.href) : new TextRun({ text: contact.text, color: theme.muted }),
  ]);
}

function headerParagraphs(view: CvView, theme: DocxTheme): Paragraph[] {
  const alignment = theme.centered ? AlignmentType.CENTER : AlignmentType.LEFT;
  const paragraphs: Paragraph[] = [];
  if (view.name) {
    paragraphs.push(new Paragraph({ heading: HeadingLevel.TITLE, alignment, children: [new TextRun(view.name)] }));
  }
  if (view.headline) {
    paragraphs.push(
      new Paragraph({
        alignment,
        children: [new TextRun({ text: view.headline, size: 24, color: theme.centered ? theme.muted : theme.accent })],
      })
    );
  }
  if (view.contacts.length > 0) {
    paragraphs.push(
      new Paragraph({
        alignment,
        spacing: { before: 80 },
        border: theme.centered ? { bottom: { style: BorderStyle.SINGLE, size: 8, color: '111827', space: 6 } } : undefined,
        children: contactRuns(view.contacts, theme),
      })
    );
  }
  return paragraphs;
}

function entryParagraphs(entry: EntryView, theme: DocxTheme): Paragraph[] {
  const paragraphs = [
    new Paragraph({
      keepNext: true,
      spacing: { before: 120 },
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }],
      children: [
        new TextRun({ text: entry.title, bold: true }),
        ...(entry.dates ? [new TextRun({ children: [new Tab(), entry.dates], color: theme.muted })] : []),
      ],
    }),
  ];
  if (entry.subtitle) {
    paragraphs.push(new Paragraph({ keepNext: true, children: [new TextRun({ text: entry.subtitle, color: theme.muted })] }));
  }
  if (entry.link) {
    paragraphs.push(new Paragraph({ keepNext: true, children: [link(entry.link.text, entry.link.href)] }));
  }
  for (const detail of entry.details) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: detail, color: theme.muted })] }));
  }
  if (entry.intro) {
    paragraphs.push(new Paragraph({ spacing: { before: 40 }, children: [new TextRun(entry.intro)] }));
  }
  for (const bullet of entry.bullets) {
    paragraphs.push(new Paragraph({ numbering: { reference: BULLETS, level: 0 }, children: [new TextRun(bullet)] }));
  }
  return paragraphs;
}

function sectionParagraphs(id: SectionId, view: CvView, theme: DocxTheme): Paragraph[] {
  let body: Paragraph[] = [];
  if (id === 'summary') {
    body = view.summary ? [new Paragraph({ children: [new TextRun(view.summary)] })] : [];
  } else if (id === 'skills') {
    body = view.skills.map(
      (group) =>
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: `${group.label}: `, bold: true }), new TextRun(group.items.join(', '))],
        })
    );
  } else {
    body = view[id].flatMap((entry) => entryParagraphs(entry, theme));
  }
  if (body.length === 0) return [];
  return [new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, children: [new TextRun(SECTION_TITLES[id])] }), ...body];
}

/** Client-side only; import lazily so docx stays out of the initial bundle. */
export async function renderCvDocx(data: CVData, template: TemplateId): Promise<Blob> {
  const view = buildCvView(data);
  const theme = THEMES[template];

  const doc = new Document({
    creator: 'GenCV',
    title: view.meta.title,
    subject: view.meta.subject,
    keywords: view.meta.keywords,
    styles: {
      default: {
        document: { run: { font: theme.font, size: 21 }, paragraph: { spacing: { line: 264 } } },
        title: {
          run: { font: theme.font, size: 40, bold: true, color: '111827' },
          paragraph: { spacing: { after: 40 } },
        },
        heading2: {
          run: { font: theme.font, size: 22, bold: true, allCaps: true, color: theme.accent },
          paragraph: {
            spacing: { before: 240, after: 80 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: theme.centered ? '111827' : 'CBD5E1', space: 2 } },
          },
        },
        hyperlink: { run: { color: theme.accent, underline: {} } },
      },
    },
    numbering: {
      config: [
        {
          reference: BULLETS,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 240 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE.width, height: PAGE.height },
            margin: { top: PAGE.marginY, bottom: PAGE.marginY, left: PAGE.marginX, right: PAGE.marginX },
          },
        },
        children: [...headerParagraphs(view, theme), ...view.sectionOrder.flatMap((id) => sectionParagraphs(id, view, theme))],
      },
    ],
  });

  return Packer.toBlob(doc);
}
