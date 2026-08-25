import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function AuroraText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('aurora-text bg-clip-text text-transparent', className)}>{children}</span>;
}
