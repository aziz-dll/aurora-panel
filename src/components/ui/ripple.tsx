import { cn } from '../../lib/cn';

interface RippleProps {
  className?: string;
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
}

export function Ripple({ className, mainCircleSize = 210, mainCircleOpacity = 0.24, numCircles = 8 }: RippleProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 flex items-center justify-center [mask-image:linear-gradient(to_bottom,white,transparent)]',
        className,
      )}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        const opacity = mainCircleOpacity - i * 0.03;
        const animationDelay = `${i * 0.06}s`;
        return (
          <div
            key={i}
            className="animate-ripple absolute rounded-full border bg-accent/5"
            style={
              {
                width: `${size}px`,
                height: `${size}px`,
                opacity,
                animationDelay,
                borderWidth: '1px',
                borderColor: 'var(--accent)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(1)',
                '--i': i,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
