import Link from 'next/link';

export default function Hero() {
  return (
    <section className="text-center py-24 px-6">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        Build your CV with AI
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
        Generate a professional CV in minutes using our AI-powered builder.
      </p>
      <Link
        href="/apps/web"
        className="inline-block px-6 py-3 bg-purple-600 text-white rounded font-medium"
      >
        Start Now
      </Link>
    </section>
  );
}
