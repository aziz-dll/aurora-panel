import type { CSSProperties } from 'react';
import { cn } from '../../lib/cn';

interface BorderBeamProps {
  className?: string;
  duration?: number;
  delay?: number;
  color?: string;
}

export function BorderBeam({ className, duration = 7, delay = 0, color }: BorderBeamProps) {
  return (
    <div
      aria-hidden
      className={cn('border-beam', className)}
      style={
        {
          '--beam-color': color ?? 'var(--accent)',
          '--beam-duration': `${duration}s`,
          '--beam-delay': `-${delay}s`,
        } as CSSProperties
      }
    />
  );
}
