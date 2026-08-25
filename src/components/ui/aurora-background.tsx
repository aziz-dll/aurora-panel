import { cn } from '../../lib/cn';

export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none fixed inset-0 overflow-hidden', className)}>
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-paper/60" />
    </div>
  );
}
