import { useEffect, useState } from 'react';
import { AuroraLogo } from './AuroraLogo';
import { cx } from '../lib/utils';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'show' | 'fade'>('show');

  useEffect(() => {
    const showTimer = setTimeout(() => setPhase('fade'), 1200);
    const doneTimer = setTimeout(() => onDone(), 1600);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={cx(
        'surface fixed top-0 right-0 bottom-0 left-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-300',
        phase === 'fade' ? 'pointer-events-none opacity-0' : 'opacity-100'
      )}
    >
      <div className="mb-8 animate-[splash-pulse_1.4s_ease-in-out_infinite]">
        <AuroraLogo size={96} />
      </div>

      <h1 className="display-small font-bold tracking-tight aurora-text">
        Aurora
      </h1>
      <p className="body-medium mt-2 text-on-surface-variant animate-[splash-dots_1.5s_ease-in-out_infinite]">
        yükleniyor…
      </p>

      <div className="m3-progress absolute right-0 bottom-0 left-0">
        <div className="m3-progress-indeterminate" />
      </div>
    </div>
  );
}
