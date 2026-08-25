import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  shimmerDuration?: string;
  background?: string;
  children: ReactNode;
}

export function ShimmerButton({
  shimmerColor = 'rgba(255,255,255,0.65)',
  shimmerSize = '0.08em',
  shimmerDuration = '2.4s',
  background = 'var(--accent)',
  className,
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      style={
        {
          '--shimmer-color': shimmerColor,
          '--shimmer-size': shimmerSize,
          '--shimmer-duration': shimmerDuration,
          '--shimmer-bg': background,
        } as CSSProperties
      }
      className={cn(
        'group relative inline-flex cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-transform duration-150 [background:var(--shimmer-bg)] active:scale-[0.96]',
        className,
      )}
      {...props}
    >
      <span
        className="absolute inset-0 overflow-hidden rounded-[inherit]"
        style={{
          maskImage: 'linear-gradient(transparent, black), linear-gradient(black, transparent)',
          maskComposite: 'intersect',
        }}
      >
        <span
          className="animate-shimmer absolute inset-[-100%]"
          style={{
            background: `conic-gradient(from 0deg, transparent 0 340deg, var(--shimmer-color) 360deg)`,
            animationDuration: 'var(--shimmer-duration)',
          }}
        />
      </span>
      <span className="relative z-10 inline-flex items-center gap-1.5">{children}</span>
    </button>
  );
}
