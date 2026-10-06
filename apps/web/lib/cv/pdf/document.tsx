import { Document, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { Fragment, type ReactNode } from 'react';
import { orderSectionsForTemplate, type ContactItem, type CvView, type EntryView, type SectionView } from '../format';
import type { TemplateId } from '../templates';

interface Theme {
  font: string;
  accent: string;
  text: string;
  muted: string;
  rule: string;
  header: 'left' | 'center' | 'band';
  heading: 'underline' | 'rule' | 'bar';
}

// All templates are single-column with real text and standard headings so ATS parsers
// read them in order; they differ only in typography and accents.
const THEMES: Record<TemplateId, Theme> = {
  professional: { font: 'Inter', accent: '#1d4ed8', text: '#111827', muted: '#4b5563', rule: '#bfdbfe', header: 'left', heading: 'underline' },
  minimal: { font: 'Inter', accent: '#374151', text: '#111827', muted: '#4b5563', rule: '#d1d5db', header: 'left', heading: 'underline' },
  executive: { font: 'Source Serif 4', accent: '#111827', text: '#111827', muted: '#374151', rule: '#111827', header: 'center', heading: 'rule' },
  tech: { font: 'Inter', accent: '#0f766e', text: '#111827', muted: '#4b5563', rule: '#99f6e4', header: 'left', heading: 'bar' },
  academic: { font: 'Source Serif 4', accent: '#1e3a8a', text: '#111827', muted: '#374151', rule: '#1e3a8a', header: 'left', heading: 'rule' },
  creative: { font: 'Inter', accent: '#6d28d9', text: '#1f2937', muted: '#4b5563', rule: '#ddd6fe', header: 'band', heading: 'bar' },
};

const PAGE_X = 42;
const PAGE_TOP = 36;
// react-pdf 4.9 resolves a unitless lineHeight against the node's *own* fontSize (default 18,
// not the inherited one), and an inherited lineHeight hides `render` text such as page
// numbers. So every text style below sets fontSize and lineHeight together.
const LINE_HEIGHT = 1.4;
const BODY_SIZE = 10;

function createStyles(theme: Theme) {
  return StyleSheet.create({
    page: {
      paddingTop: PAGE_TOP,
      paddingBottom: 44,
      paddingHorizontal: PAGE_X,
      fontFamily: theme.font,
      fontSize: BODY_SIZE,
      color: theme.text,
    },
    header: { marginBottom: 4 },
    headerCentered: {
      alignItems: 'center',
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.rule,
    },
    band: {
      marginTop: -PAGE_TOP,
      marginHorizontal: -PAGE_X,
      marginBottom: 6,
      paddingHorizontal: PAGE_X,
      paddingTop: 26,
      paddingBottom: 20,
      backgroundColor: theme.accent,
    },
    name: { fontSize: 22, fontWeight: 700, lineHeight: 1.15 },
    headline: { fontSize: 11.5, marginTop: 3, lineHeight: LINE_HEIGHT },
    contacts: { marginTop: 6 },
    body: { fontSize: BODY_SIZE, lineHeight: LINE_HEIGHT },
    sectionStart: { marginTop: 12 },
    entryStart: { marginTop: 7 },
    sectionTitleBlock: {
      marginBottom: 6,
      paddingBottom: 2,
      borderBottomWidth: theme.heading === 'rule' ? 1 : 0.75,
      borderBottomColor: theme.rule,
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    sectionTitleBar: { width: 3, height: 11, marginRight: 6, backgroundColor: theme.accent },
    sectionTitle: {
      fontSize: 10.5,
      fontWeight: 700,
      lineHeight: LINE_HEIGHT,
      // Wide tracking plus Source Serif's kerning (e.g. "KA") makes text extraction split headings
      // ("SERTIFIK ASI"), which can stop ATS parsers recognising the section.
      letterSpacing: theme.font === 'Source Serif 4' ? 0 : 1,
      textTransform: 'uppercase',
      color: theme.heading === 'rule' ? theme.text : theme.accent,
    },
    paragraph: { marginTop: 2, fontSize: BODY_SIZE, lineHeight: LINE_HEIGHT },
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    entryTitle: { flex: 1, fontSize: 10.5, fontWeight: 600, lineHeight: LINE_HEIGHT },
    entryDates: { marginLeft: 12, fontSize: 9.5, color: theme.muted, lineHeight: LINE_HEIGHT },
    entrySubtitle: { fontSize: 9.5, color: theme.muted, lineHeight: LINE_HEIGHT },
    entryLink: { fontSize: 9.5, color: theme.accent, textDecoration: 'none', lineHeight: LINE_HEIGHT },
    bullet: { flexDirection: 'row', marginTop: 2 },
    bulletMark: { width: 10, fontSize: BODY_SIZE, lineHeight: LINE_HEIGHT },
    bulletText: { flex: 1, fontSize: BODY_SIZE, lineHeight: LINE_HEIGHT },
    skillLine: { marginBottom: 2, fontSize: BODY_SIZE, lineHeight: LINE_HEIGHT },
    skillLabel: { fontWeight: 600 },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    headerText: { flex: 1 },
    photo: { width: 64, height: 64, borderRadius: 32, marginLeft: 16, objectFit: 'cover' },
    photoCentered: { width: 64, height: 64, borderRadius: 32, marginBottom: 8, objectFit: 'cover' },
    pageNumber: {
      position: 'absolute',
      bottom: 20,
      left: PAGE_X,
      right: PAGE_X,
      textAlign: 'right',
      fontSize: 8,
      color: theme.muted,
    },
  });
}

type Styles = ReturnType<typeof createStyles>;

/**
 * Each contact is its own text block in a wrapping row, so a long line breaks between
 * items. As one paragraph, react-pdf could break inside it and insert a stray hyphen.
 */
function ContactLine({
  contacts,
  color,
  linkColor,
  centered,
}: {
  contacts: ContactItem[];
  color: string;
  linkColor: string;
  centered?: boolean;
}) {
  const text = { color, fontSize: 9.5, lineHeight: LINE_HEIGHT };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: centered ? 'center' : 'flex-start' }}>
      {contacts.map((contact, index) => (
        <View key={`${contact.text}-${index}`} style={{ flexDirection: 'row' }} wrap={false}>
          {index > 0 ? <Text style={[text, { marginHorizontal: 6 }]}>|</Text> : null}
          {contact.href ? (
            <Link src={contact.href} style={[text, { color: linkColor, textDecoration: 'none' }]}>
              {contact.text}
            </Link>
          ) : (
            <Text style={text}>{contact.text}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function Header({ view, theme, s }: { view: CvView; theme: Theme; s: Styles }) {
  if (theme.header === 'band') {
    return (
      <View style={[s.band, s.headerRow]}>
        <View style={s.headerText}>
        {view.name ? <Text style={[s.name, { color: '#ffffff' }]}>{view.name}</Text> : null}
        {view.headline ? <Text style={[s.headline, { color: '#ede9fe' }]}>{view.headline}</Text> : null}
        {view.contacts.length > 0 ? (
          <View style={s.contacts}>
            <ContactLine contacts={view.contacts} color="#f5f3ff" linkColor="#ffffff" />
          </View>
        ) : null}
        </View>
        {view.photo ? <Image src={view.photo} style={s.photo} /> : null}
      </View>
    );
  }

  const centered = theme.header === 'center';
  const align = centered ? 'center' : 'left';
  return (
    <View style={centered ? [s.header, s.headerCentered] : [s.header, s.headerRow]}>
      {centered && view.photo ? <Image src={view.photo} style={s.photoCentered} /> : null}
      <View style={centered ? { alignItems: 'center' } : s.headerText}>
      {view.name ? <Text style={[s.name, { textAlign: align }]}>{view.name}</Text> : null}
      {view.headline ? (
        <Text style={[s.headline, { textAlign: align, color: centered ? theme.muted : theme.accent }]}>
          {view.headline}
        </Text>
      ) : null}
      {view.contacts.length > 0 ? (
        <View style={[s.contacts, { alignItems: centered ? 'center' : 'flex-start' }]}>
          <ContactLine contacts={view.contacts} color={theme.muted} linkColor={theme.muted} centered={centered} />
        </View>
      ) : null}
      </View>
      {!centered && view.photo ? <Image src={view.photo} style={s.photo} /> : null}
    </View>
  );
}


function SectionTitle({ title, theme, s }: { title: string; theme: Theme; s: Styles }) {
  if (theme.heading === 'bar') {
    return (
      <View style={s.sectionTitleRow}>
        <View style={s.sectionTitleBar} />
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
    );
  }
  return (
    <View style={s.sectionTitleBlock}>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

function EntryHeader({ entry, s }: { entry: EntryView; s: Styles }) {
  return (
    <>
      <View style={s.entryHeader}>
        <Text style={s.entryTitle}>{entry.title}</Text>
        {entry.dates ? <Text style={s.entryDates}>{entry.dates}</Text> : null}
      </View>
      {entry.subtitle ? <Text style={s.entrySubtitle}>{entry.subtitle}</Text> : null}
      {entry.link ? (
        <Link src={entry.link.href} style={s.entryLink}>
          {entry.link.text}
        </Link>
      ) : null}
      {entry.details.map((detail) => (
        <Text key={detail} style={s.entrySubtitle}>
          {detail}
        </Text>
      ))}
    </>
  );
}

function Bullet({ text, s }: { text: string; s: Styles }) {
  return (
    <View style={s.bullet} wrap={false}>
      <Text style={s.bulletMark}>•</Text>
      <Text style={s.bulletText}>{text}</Text>
    </View>
  );
}

/**
 * Page-break rules: a section heading always travels with the first entry, and an entry
 * header always travels with its first line, so neither is stranded at the bottom of a
 * page. Each "lead" is an unbreakable block; the remaining lines follow as siblings.
 * (react-pdf's minPresenceAhead is ignored for first children, so it can't do this.)
 */
function leadBlock(key: string, style: Styles['sectionStart'], children: ReactNode) {
  return (
    <View key={key} wrap={false} style={style}>
      {children}
    </View>
  );
}

function entryBlocks(entry: EntryView, key: string, s: Styles, heading: ReactNode): ReactNode[] {
  const lines: ReactNode[] = [];
  if (entry.intro) lines.push(<Text style={s.paragraph}>{entry.intro}</Text>);
  for (const bullet of entry.bullets) lines.push(<Bullet text={bullet} s={s} />);
  const [first, ...rest] = lines;

  return [
    leadBlock(
      `${key}-lead`,
      heading ? s.sectionStart : s.entryStart,
      <>
        {heading}
        <EntryHeader entry={entry} s={s} />
        {first}
      </>
    ),
    ...rest.map((line, index) => <Fragment key={`${key}-${index}`}>{line}</Fragment>),
  ];
}

export function CvDocument({ view, template }: { view: CvView; template: TemplateId }) {
  const theme = THEMES[template];
  const s = createStyles(theme);
  const sectionBlocks = (section: SectionView): ReactNode[] => {
    const heading = <SectionTitle title={section.title} theme={theme} s={s} />;
    if (section.kind === 'text') {
      return [leadBlock(section.id, s.sectionStart, <>{heading}<Text style={s.body}>{section.text}</Text></>)];
    }
    if (section.kind === 'lines') {
      const lines = section.lines.map((group, index) => (
        <Text key={`${section.id}-${index}`} style={s.skillLine}>
          {group.label ? <Text style={s.skillLabel}>{group.label}: </Text> : null}
          {group.items.join(', ')}
        </Text>
      ));
      const [first, ...rest] = lines;
      return [leadBlock(section.id, s.sectionStart, <>{heading}{first}</>), ...rest];
    }
    return section.entries.flatMap((entry, index) =>
      entryBlocks(entry, `${section.id}-${index}`, s, index === 0 ? heading : null)
    );
  };

  return (
    <Document
      title={view.meta.title}
      author={view.meta.author}
      subject={view.meta.subject}
      keywords={view.meta.keywords}
      creator="GenCV"
      producer="GenCV"
      language={view.language}
    >
      <Page size={view.paper} style={s.page}>
        <Header view={view} theme={theme} s={s} />
        {orderSectionsForTemplate(view.sections, template).flatMap(sectionBlocks)}
        <Text
          fixed
          style={s.pageNumber}
          render={({ pageNumber, totalPages }) => (totalPages > 1 ? `${pageNumber} / ${totalPages}` : '')}
        />
      </Page>
    </Document>
  );
}
