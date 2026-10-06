import type { Metadata } from 'next';
import { EditorShell } from './_components/editor-shell';

export const metadata: Metadata = {
  title: 'Editor CV · GenCV',
};

export default function EditorPage() {
  return <EditorShell />;
}
