import Link from 'next/link';

export default function CTA() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900 text-center">
      <h2 className="text-2xl font-semibold mb-4">
        Ready to create your CV?
      </h2>
      <Link
        href="/apps/web"
        className="inline-block px-6 py-3 bg-purple-600 text-white rounded font-medium"
      >
        Get Started
      </Link>
    </section>
  );
}
