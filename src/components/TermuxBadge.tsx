import { useTermuxStatus } from '../lib/useTermuxStatus';
import { cx } from '../lib/utils';
import { Icon } from '../lib/icons';

export function TermuxBadge() {
  const { connected, battery } = useTermuxStatus();

  const label = connected === true ? 'Bağlı' : connected === false ? 'Termux API offline' : 'Termux API…';

  return (
    <div className="m3-chip">
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {connected && (
          <span className="absolute top-0 left-0 h-1.5 w-1.5 animate-ping rounded-full bg-[#34d399]" aria-hidden="true" />
        )}
        <span
          className={cx(
            'relative h-1.5 w-1.5 rounded-full',
            connected === null ? 'bg-outline-variant' : connected ? 'bg-[#34d399]' : 'bg-[#a8a29e]'
          )}
          aria-hidden="true"
        />
      </span>
      {connected && battery ? (
        <>
          <Icon name="battery" size={12} className="shrink-0 text-on-surface-variant" aria-hidden="true" />
          <span className="truncate font-medium">
            Batarya %{battery.percent ?? '?'}{battery.charging ? ' ⚡' : ''}
          </span>
        </>
      ) : (
        <span className="truncate font-medium text-on-surface-variant">{label}</span>
      )}
    </div>
  );
}
