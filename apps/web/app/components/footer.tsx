import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t p-4 text-center text-sm text-muted-foreground">
      <p>&copy; {new Date().getFullYear()} GenCV. All rights reserved.</p>
      <div className="mt-2 flex justify-center gap-4">
        <Link href="/templates" className="hover:underline">
          Templates
        </Link>
        <Link href="/builder" className="hover:underline">
          Get Started
        </Link>
      </div>
    </footer>
  );
}

