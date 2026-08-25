import { useEffect, type ReactNode } from 'react';
import { Icon } from '../lib/icons';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 animate-[fade-in_150ms_ease]" onClick={onClose} />
      <div className="relative flex max-h-[88dvh] w-full flex-col overflow-y-auto rounded-t-2xl border border-line bg-paper p-5 shadow-[var(--shadow-pop)] animate-[pop-in_240ms_var(--ease-spring)] sm:max-w-md sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="btn btn-ghost -mr-1 p-1.5 text-soft" aria-label="Kapat">
            <Icon name="x" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-line py-10 text-center">
      <span className="text-3xl opacity-70">{emoji}</span>
      <p className="text-sm text-faint">{text}</p>
    </div>
  );
}
