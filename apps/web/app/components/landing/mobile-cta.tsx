'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ds';
import { cn } from '@/lib/cn';

/**
 * Bottom call to action on small screens, shown once the hero CTA has scrolled away. The spacer
 * keeps the footer from ending up underneath the bar.
 */
export function MobileCta({ href = '/editor', label = 'Mulai buat CV gratis' }: { href?: string; label?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 480);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <>
      <div aria-hidden="true" className="h-20 md:hidden" />
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur transition-transform duration-200 md:hidden',
          'pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
          visible ? 'translate-y-0' : 'pointer-events-none translate-y-full'
        )}
        // Hidden from assistive tech while off-screen; the same link exists in the hero.
        aria-hidden={!visible}
      >
        <Button asChild variant="primary" className="w-full">
          <Link href={href} tabIndex={visible ? undefined : -1}>
            {label}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </>
  );
}
