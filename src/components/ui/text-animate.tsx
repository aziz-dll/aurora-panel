import { motion, type Variants } from 'motion/react';
import { cn } from '../../lib/cn';

interface TextAnimateProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  by?: 'word' | 'character';
}

export function TextAnimate({ text, className, delay = 0, duration = 0.35, by = 'word' }: TextAnimateProps) {
  const segments = by === 'word' ? text.split(' ') : Array.from(text);
  const container: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: delay },
    },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 8, filter: 'blur(4px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.span
      className={cn('inline-block', className)}
      variants={container}
      initial="hidden"
      animate="visible"
      aria-label={text}
    >
      {segments.map((seg, i) => (
        <motion.span key={i} variants={item} className="inline-block whitespace-pre" aria-hidden>
          {seg}
          {by === 'word' && i < segments.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </motion.span>
  );
}
