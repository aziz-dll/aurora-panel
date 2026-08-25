import { motion } from 'motion/react';
import { Children, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedList({ children, className, delay = 0.05 }: AnimatedListProps) {
  return (
    <div className={cn(className)}>
      {Children.toArray(children).map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10, scale: 0.98, filter: 'blur(2px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={{ delay: i * delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
