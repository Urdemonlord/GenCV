import Link from 'next/link';
import { Button } from '@cv-generator/ui';

export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-4 py-20">
      <h2 className="text-3xl sm:text-5xl font-bold max-w-2xl mx-auto">
        CV profesional yang lolos ATS, dibuat{' '}
        <span className="text-purple-500">dalam hitungan menit</span>
      </h2>
      <p className="mt-4 text-sm sm:text-lg text-muted-foreground max-w-2xl">
        GenCV membantu fresh graduate dan profesional menulis CV yang relevan dengan
        lowongan—dengan template siap pakai, bantuan AI, dan ekspor instan.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg">
          <Link href="/builder">Mulai Buat CV</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/templates">Lihat Template</Link>
        </Button>
      </div>
    </section>
  );
}
