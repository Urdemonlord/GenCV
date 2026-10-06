import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { EditorEntry } from './_components/editor-entry';
import { EditorShell } from './_components/editor-shell';

export const metadata: Metadata = pageMetadata({
  title: 'Editor CV',
  description: 'Tulis CV dengan pratinjau PDF langsung, analisis ATS, Job Match, dan saran AI. Data tersimpan di perangkatmu.',
  path: '/editor',
  index: false,
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function EditorPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const id = first(params.id);
  // Remount per document so no state leaks from one CV into another.
  if (id) return <EditorShell key={id} id={id} />;
  return <EditorEntry createNew={first(params.new) === '1'} template={first(params.template)} />;
}
