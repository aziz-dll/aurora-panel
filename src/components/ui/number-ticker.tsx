import { useEffect, useRef, type ReactNode } from 'react';
import { useInView, useMotionValue, useSpring } from 'motion/react';
import { cn } from '../../lib/cn';

interface NumberTickerProps {
  value: number;
  direction?: 'up' | 'down';
  delay?: number;
  className?: string;
  decimalPlaces?: number;
  suffix?: ReactNode;
}

export function NumberTicker({
  value,
  direction = 'up',
  delay = 0,
  className,
  decimalPlaces = 0,
  suffix,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? value : 0);
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  useEffect(() => {
    const id = setTimeout(() => {
      if (isInView) motionValue.set(direction === 'down' ? 0 : value);
    }, delay * 1000);
    return () => clearTimeout(id);
  }, [motionValue, isInView, delay, value, direction]);

  useEffect(
    () =>
      springValue.on('change', (latest) => {
        if (ref.current) {
          ref.current.textContent = Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(Number(latest.toFixed(decimalPlaces)));
        }
      }),
    [springValue, decimalPlaces],
  );

  return (
    <span className={cn('inline-block tabular-nums tracking-tight', className)}>
      <span ref={ref}>0</span>
      {suffix}
    </span>
  );
}
