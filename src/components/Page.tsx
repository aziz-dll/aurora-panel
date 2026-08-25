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
    <div className="mx-auto w-full max-w-[880px] px-5 pb-24 pt-7 md:px-10 md:pb-16 md:pt-10">
      <header className="mb-6">
        {icon && <div className="mb-1 text-[38px] leading-none select-none">{icon}</div>}
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[26px] font-bold tracking-tight md:text-[32px]">{title}</h1>
          {actions && <div className="mt-1.5 flex shrink-0 gap-1.5">{actions}</div>}
        </div>
        {subtitle && <p className="mt-1 text-sm text-soft">{subtitle}</p>}
      </header>
      {children}
    </div>
  );
}
