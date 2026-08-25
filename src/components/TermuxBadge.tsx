import { useTermuxStatus } from '../lib/useTermuxStatus';

export function TermuxBadge() {
  const { connected, battery } = useTermuxStatus();

  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-soft">
      <span
        className={
          'h-1.5 w-1.5 shrink-0 rounded-full ' +
          (connected === null ? 'bg-faint' : connected ? 'bg-emerald-500' : 'bg-zinc-400 opacity-50')
        }
      />
      {connected && battery ? (
        <span className="truncate">
          Batarya %{battery.percent ?? '?'}
          {battery.charging ? ' ⚡' : ''}
        </span>
      ) : (
        <span className="truncate">{connected === false ? 'Termux API kapalı' : 'Termux API…'}</span>
      )}
    </div>
  );
}
