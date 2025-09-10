import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b">
      <Link href="/" className="text-xl font-bold">GenCV</Link>
      <nav className="flex items-center gap-4">
        <ThemeToggle />
      </nav>
    </header>
  );
}
