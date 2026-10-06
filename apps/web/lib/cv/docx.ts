import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  Tab,
  TabStopType,
  TextRun,
} from 'docx';
import { buildCvView, type ContactItem, type CvView, type EntryView, type SectionView } from './format';
import type { CV } from './schema';
import type { TemplateId } from './templates';

// Page sizes in twentieths of a point.
const PAPER = { A4: { width: 11906, height: 16838 }, LETTER: { width: 12240, height: 15840 } } as const;
const MARGIN = { x: 850, y: 720 };
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

function photoBytes(dataUrl: string): Uint8Array | null {
  const match = dataUrl.match(/^data:image\/jpeg;base64,(.+)$/);
  if (!match) return null;
  return Uint8Array.from(atob(match[1]), (c) => c.charCodeAt(0));
}

function headerParagraphs(view: CvView, theme: DocxTheme): Paragraph[] {
  const alignment = theme.centered ? AlignmentType.CENTER : AlignmentType.LEFT;
  const paragraphs: Paragraph[] = [];
  const photo = photoBytes(view.photo);
  if (photo) {
    paragraphs.push(
      new Paragraph({
        alignment,
        children: [new ImageRun({ type: 'jpg', data: photo, transformation: { width: 72, height: 72 } })],
      })
    );
  }
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

function entryParagraphs(entry: EntryView, theme: DocxTheme, contentWidth: number): Paragraph[] {
  const paragraphs = [
    new Paragraph({
      keepNext: true,
      spacing: { before: 120 },
      tabStops: [{ type: TabStopType.RIGHT, position: contentWidth }],
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

function sectionParagraphs(section: SectionView, theme: DocxTheme, contentWidth: number): Paragraph[] {
  const body =
    section.kind === 'text'
      ? [new Paragraph({ children: [new TextRun(section.text)] })]
      : section.kind === 'lines'
        ? section.lines.map(
            (group) =>
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  ...(group.label ? [new TextRun({ text: group.label + ': ', bold: true })] : []),
                  new TextRun(group.items.join(', ')),
                ],
              })
          )
        : section.entries.flatMap((entry) => entryParagraphs(entry, theme, contentWidth));
  return [new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, children: [new TextRun(section.title)] }), ...body];
}

/** Client-side only; import lazily so docx stays out of the initial bundle. */
export async function renderCvDocx(data: CV, template: TemplateId): Promise<Blob> {
  const view = buildCvView(data);
  const theme = THEMES[template];
  const page = PAPER[view.paper];
  const contentWidth = page.width - MARGIN.x * 2;

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
            size: { width: page.width, height: page.height },
            margin: { top: MARGIN.y, bottom: MARGIN.y, left: MARGIN.x, right: MARGIN.x },
          },
        },
        children: [...headerParagraphs(view, theme), ...view.sections.flatMap((section) => sectionParagraphs(section, theme, contentWidth))],
      },
    ],
  });

  return Packer.toBlob(doc);
}
