import { motion, useMotionTemplate, useMotionValue } from 'motion/react';
import { useCallback, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface MagicCardProps {
  children: ReactNode;
  className?: string;
  gradientSize?: number;
  gradientOpacity?: number;
}

export function MagicCard({ children, className, gradientSize = 220, gradientOpacity = 1 }: MagicCardProps) {
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const { left, top } = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - left);
      mouseY.set(e.clientY - top);
    },
    [mouseX, mouseY],
  );

  const reset = useCallback(() => {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }, [gradientSize, mouseX, mouseY]);

  const spotlight = useMotionTemplate`
    radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
    var(--accent-soft),
    transparent 100%)
  `;

  return (
    <div
      className={cn('group relative isolate overflow-hidden rounded-2xl', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
    >
      <div className="relative z-10 h-full">{children}</div>
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: spotlight, opacity: gradientOpacity }}
      />
    </div>
  );
}
