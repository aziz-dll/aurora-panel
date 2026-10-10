import { useEffect, type ReactNode } from 'react';
import { Icon } from '../lib/icons';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Dialog({ open, onClose, title, children, actions }: DialogProps) {
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
    <div
      className="fixed top-0 right-0 bottom-0 left-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="m3-scrim" onClick={onClose} />
      <div className="m3-dialog">
        <div className="flex items-start justify-between">
          <h2 className="m3-dialog-title min-w-0 flex-1 text-on-surface">{title}</h2>
          <button
            onClick={onClose}
            className="m3-icon-btn mt-3 mr-3 shrink-0"
            aria-label="Kapat"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="m3-dialog-content">{children}</div>
        {actions && <div className="m3-dialog-actions">{actions}</div>}
      </div>
    </div>
  );
}

export function Empty({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-surface-container-low p-8 text-center">
      <span className="mb-3 text-4xl opacity-70" aria-hidden="true">{emoji}</span>
      <p className="body-medium text-on-surface-variant">{text}</p>
    </div>
  );
}
