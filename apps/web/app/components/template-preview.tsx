import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@cv-generator/ui';

export default function TemplatePreview() {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4 grid gap-10 lg:grid-cols-2 items-center">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Preview Our Best CV Templates
          </h2>
          <p className="mt-4 text-muted-foreground">
            Explore modern layouts that highlight your experience beautifully. Pick a
            template, customize it, and make it your own in minutes.
          </p>
          <div className="mt-6">
            <Button asChild size="lg">
              <Link href="/templates">View Templates</Link>
            </Button>
          </div>
        </div>
        <div className="relative">
          <Image
            src="/template-preview.svg"
            alt="CV template preview"
            width={960}
            height={720}
            className="w-full h-auto rounded-2xl border bg-white shadow-sm"
            priority
          />
        </div>
      </div>
    </section>
  );
}
