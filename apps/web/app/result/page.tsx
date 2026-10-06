import { redirect } from 'next/navigation';

// The step wizard and result page were merged into the editor workspace.
export default function LegacyPage() {
  redirect('/editor');
}
