import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

const DEFAULT_MAGNIFICATION = 62;
const DEFAULT_DISTANCE = 130;

interface DockProps {
  children: ReactNode;
  className?: string;
  iconSize?: number;
  iconMagnification?: number;
  iconDistance?: number;
  direction?: 'top' | 'middle' | 'bottom';
}

export function Dock({
  children,
  className,
  iconSize = 44,
  iconMagnification = DEFAULT_MAGNIFICATION,
  iconDistance = DEFAULT_DISTANCE,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        'supports-backdrop-blur:bg-white/10 supports-backdrop-blur:dark:bg-black/10 mx-auto flex h-[60px] w-max items-end gap-1.5 rounded-2xl border border-line/70 bg-paper/70 p-1.5 shadow-[var(--shadow-pop)] backdrop-blur-xl',
        className,
      )}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <DockItem key={i} mouseX={mouseX} size={iconSize} magnification={iconMagnification} distance={iconDistance}>
              {child}
            </DockItem>
          ))
        : children}
    </motion.div>
  );
}

function DockItem({
  mouseX,
  size,
  magnification,
  distance,
  children,
}: {
  mouseX: MotionValue<number>;
  size: number;
  magnification: number;
  distance: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const padding = Math.max(6, size * 0.14);

  const distanceCalc = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const sizeTransform = useTransform(distanceCalc, [-distance, 0, distance], [size, magnification, size]);
  const widthSync = useSpring(sizeTransform, { mass: 0.1, stiffness: 170, damping: 14 });

  return (
    <motion.div
      ref={ref}
      style={{ width: widthSync, height: widthSync, padding }}
      className="flex aspect-square items-center justify-center"
    >
      {children}
    </motion.div>
  );
}
