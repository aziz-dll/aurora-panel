import type { ReactNode } from 'react';

export function Page({
  icon,
  title,
  subtitle,
  actions,
  children,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pb-28 pt-4 md:px-10 md:pb-16 md:pt-10">
      <header className="mb-6">
        {icon && <div className="mb-1 text-[26px] leading-none select-none md:text-[38px]">{icon}</div>}
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 text-[22px] font-bold tracking-tight md:text-[32px]">{title}</h1>
          {actions && <div className="mt-1 flex shrink-0 gap-1.5">{actions}</div>}
        </div>
        {subtitle && <p className="mt-1 text-[13px] text-soft md:text-sm">{subtitle}</p>}
      </header>
      {children}
    </div>
  );
}
