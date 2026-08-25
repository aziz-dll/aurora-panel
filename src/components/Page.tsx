import type { ReactNode } from 'react';
import { BlurFade } from './ui/blur-fade';
import { TextAnimate } from './ui/text-animate';

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
    <div className={`mx-auto w-full px-4 pb-32 pt-16 md:px-10 md:pb-16 md:pt-10 ${wide ? 'max-w-[1100px]' : 'max-w-[880px]'}`}>
      <header className="mb-6">
        {icon && (
          <BlurFade delay={0}>
            <div className="mb-1 text-[26px] leading-none select-none md:text-[34px]">{icon}</div>
          </BlurFade>
        )}
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 text-[22px] font-bold tracking-tight md:text-[32px]">
            <TextAnimate text={title} />
          </h1>
          {actions && (
            <BlurFade delay={0.1} className="mt-1 flex shrink-0 gap-1.5">
              {actions}
            </BlurFade>
          )}
        </div>
        {subtitle && (
          <BlurFade delay={0.15}>
            <p className="mt-1 text-[13px] text-soft md:text-sm">{subtitle}</p>
          </BlurFade>
        )}
      </header>
      {children}
    </div>
  );
}
