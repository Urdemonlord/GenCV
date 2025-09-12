import Link from 'next/link';
import { Button } from '@cv-generator/ui';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <h1 className="text-xl font-bold">GenCV</h1>
      <nav className="flex items-center gap-4">
        <Link href="/templates" className="text-sm">
          Templates
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {mounted ? (
            theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
        </Button>
        <Button asChild size="sm">
          <Link href="/builder">Get Started</Link>
        </Button>
      </nav>
    </header>
  );
}

