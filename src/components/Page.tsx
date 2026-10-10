import type { ReactNode } from 'react';
import { cx } from '../lib/utils';

export function Page({
  icon,
  title,
  subtitle,
  actions,
  children,
  wide,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cx(
      'mx-auto w-full px-4 pb-32 pt-6 md:px-6 md:pb-24 md:pt-8 lg:px-8',
      wide ? 'max-w-[1200px]' : 'max-w-[900px]'
    )}>
      <header className="mb-8 md:mb-10">
        {icon && (
          <div className="mb-2 text-[32px] leading-none select-none md:text-[40px]" aria-hidden="true">
            {icon}
          </div>
        )}
        <div className="flex flex-wrap items-start justify-between">
          <h1 className="headline-large min-w-0 font-bold tracking-tight text-on-surface">
            {title}
          </h1>
          {actions && <div className="mt-2 shrink-0 space-x-2">{actions}</div>}
        </div>
        {subtitle && (
          <p className="body-large mt-3 max-w-[600px] text-on-surface-variant">
            {subtitle}
          </p>
        )}
      </header>
      {children}
    </div>
  );
}
