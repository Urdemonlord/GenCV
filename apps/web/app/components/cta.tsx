import Link from 'next/link';
import { Button } from '@cv-generator/ui';

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold">
          Siap naik level di proses rekrutmen?
        </h2>
        <p className="mt-4 text-lg">
          Buat CV yang lebih rapi, relevan, dan mudah diproses ATS dalam beberapa
          menit.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-100"
          >
            <Link href="/builder">Buat CV Sekarang</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white/10"
          >
            <Link href="/templates">Lihat Template</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
