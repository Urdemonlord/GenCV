import Link from 'next/link';
import { Button } from '@cv-generator/ui';

export default function TemplatesPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center p-8">
      <h1 className="text-3xl font-bold">Templates</h1>
      <p className="text-muted-foreground">Template gallery coming soon.</p>
      <Button asChild>
        <Link href="/builder">Back to Builder</Link>
      </Button>
    </div>
  );
}
