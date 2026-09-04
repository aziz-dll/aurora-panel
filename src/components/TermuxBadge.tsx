import { useTermuxStatus } from '../lib/useTermuxStatus';
import { cx } from '../lib/utils';

export function TermuxBadge() {
  const { connected, battery } = useTermuxStatus();

  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-soft">
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        )}
        <span
          className={cx(
            'relative inline-flex h-1.5 w-1.5 rounded-full',
            connected === null ? 'bg-faint' : connected ? 'bg-emerald-500' : 'bg-zinc-400 opacity-50',
          )}
        />
      </span>
      {connected && battery ? (
        <span className="truncate">
          Batarya %{battery.percent ?? '?'}
          {battery.charging ? ' ⚡' : ''}
        </span>
      ) : (
        <span className="truncate">{connected === false ? 'Termux API offline' : 'Termux API…'}</span>
      )}
    </div>
  );
}
