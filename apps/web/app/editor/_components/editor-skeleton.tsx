import { Skeleton } from '@/components/ds';

/** Editor layout placeholder (sidebar, form, preview) while the route or the stored CV loads. */
export function EditorSkeleton({ label = 'Membuka editor…' }: { label?: string }) {
  return (
    <div className="flex h-dvh flex-col" role="status">
      <span className="sr-only">{label}</span>
      <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="ml-auto h-8 w-28" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-60 shrink-0 space-y-2 border-r border-border p-3 lg:block">
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
        <div className="mx-auto w-full max-w-2xl space-y-4 p-6">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <div className="hidden w-[440px] shrink-0 border-l border-border bg-surface/40 p-6 lg:block xl:w-[520px]">
          <Skeleton className="mx-auto aspect-[1/1.414] w-full max-w-sm" />
        </div>
      </div>
    </div>
  );
}
