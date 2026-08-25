import { useMemo } from 'react';
import { Icon } from '../lib/icons';
import { workouts } from '../lib/actions';
import { DAY_SHORT, PROGRAM, isoOf, wdOf, dayDone, computeStreak, type Kind } from '../lib/fitness';
import { patchSettings, useDB } from '../lib/store';
import { cx } from '../lib/utils';

const KIND_BADGE: Record<Kind, string> = {
  guc: 'bg-[#ddebf1] text-[#183347] dark:bg-[#1e3346] dark:text-[#8fc4ea]',
  kardiyo: 'bg-[#dbeddb] text-[#1c3829] dark:bg-[#1f3b2b] dark:text-[#9fe0b0]',
  dinlenme: 'bg-hover text-soft',
};

const KIND_LABEL: Record<Kind, string> = { guc: 'Güç', kardiyo: 'Kardiyo', dinlenme: 'Dinlenme' };

function Stat({ icon, value, label }: { icon: string; value: React.ReactNode; label: string }) {
  return (
    <div className="card card-lift flex items-center gap-3 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-hover text-lg">{icon}</span>
      <div className="min-w-0">
        <div className="text-xl font-bold leading-tight tracking-tight tabular-nums">{value}</div>
        <div className="truncate text-[11px] font-medium text-soft">{label}</div>
      </div>
    </div>
  );
}

export default function Fitness() {
  const db = useDB();
  const s = db.settings;

  const weight = s.weightKg ?? 102;
  const height = s.heightCm ?? 180;
  const age = s.ageYears ?? 17;

  const bmi = weight / Math.pow(height / 100, 2);
  const idealMin = Math.round(18.5 * Math.pow(height / 100, 2));
  const idealMax = Math.round(24.9 * Math.pow(height / 100, 2));
  const hrLow = Math.round((220 - age) * 0.6);
  const hrHigh = Math.round((220 - age) * 0.75);

  const today = new Date();
  const todayWd = wdOf(today);
  const tIso = isoOf(today);

  const streak = useMemo(() => computeStreak(db.workouts), [db.workouts]);

  const weekDone = useMemo(() => {
    let n = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - todayWd + i);
      if (dayDone(db.workouts, d)) n++;
    }
    return n;
  }, [db.workouts, todayWd]);

  const totalDone = useMemo(
    () =>
      Object.keys(db.workouts).filter((k) => {
        const d = new Date(`${k}T00:00:00`);
        return !Number.isNaN(d.getTime()) && dayDone(db.workouts, d);
      }).length,
    [db.workouts],
  );

  const todayChecked = db.workouts[tIso] ?? [];
  const todayPlan = PROGRAM[todayWd];
  const todayAllDone = todayPlan.exs.every((e) => todayChecked.includes(e.id));

  const numField = (label: string, unit: string, value: number, key: 'weightKg' | 'heightCm' | 'ageYears') => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-soft">
        {label} <span className="text-faint">({unit})</span>
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => {
          const v = e.target.value === '' ? undefined : Math.round(Number(e.target.value));
          patchSettings(v === undefined || Number.isNaN(v) ? {} : { [key]: v });
        }}
        className="field font-semibold tabular-nums"
      />
    </label>
  );

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pb-28 pt-14 md:px-10 md:pb-16 md:pt-10">
      <div className="mb-1 text-[26px] leading-none md:text-[38px] select-none">🏋️</div>
      <header className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight md:text-[32px]">Spor</h1>
        <p className="mt-0.5 text-sm text-soft">Evde aletsiz program — kilona, boyuna ve yaşına göre hazırlandı.</p>
      </header>

      <section className="card mb-4 p-3 md:p-4">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-soft">
          <Icon name="target" size={14} /> Ölçülerin
        </h2>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <div className="w-24">{numField('Kilo', 'kg', weight, 'weightKg')}</div>
          <div className="w-24">{numField('Boy', 'cm', height, 'heightCm')}</div>
          <div className="w-24">{numField('Yaş', '', age, 'ageYears')}</div>
          <div className="ml-auto flex items-center gap-3">
            <div
              className="relative h-14 w-14 shrink-0"
              role="img"
              aria-label={`Vücut kitle indeksi ${bmi.toFixed(1)}`}
            >
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--line)" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="#d9730d"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(bmi, 40) * 2.43}, 100`}
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-[11px] font-bold tabular-nums">
                {bmi.toFixed(1)}
              </span>
            </div>
            <div className="text-xs leading-relaxed text-soft">
              <p className="font-semibold text-ink">VKİ {bmi.toFixed(1)}</p>
              <p>
                İdeal aralık: <b>{idealMin}–{idealMax} kg</b>
              </p>
              <p className="text-faint">Haftada 0,5 kg gayet yeterli 🐢</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-4 grid grid-cols-3 gap-3 max-sm:gap-2">
        <Stat icon="🔥" value={`${streak} gün`} label="Seri" />
        <Stat icon="📅" value={`${weekDone}/7`} label="Bu hafta" />
        <Stat icon="🏆" value={totalDone} label="Toplam tamamlanan" />
      </section>

      <section className="card mb-6 p-3 md:p-4">
        <div className="mb-2 flex items-center justify-between gap-2 text-sm">
          <span className="min-w-0 truncate font-medium">
            Bugün: {DAY_SHORT[todayWd]} — {todayPlan.focus}
          </span>
          <span
            className={cx(
              'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
              todayAllDone
                ? 'bg-[#dbeddb] text-[#1c3829] dark:bg-[#1f3b2b] dark:text-[#9fe0b0]'
                : 'bg-hover text-soft',
            )}
          >
            {todayAllDone ? 'Bitti ✓' : `${todayChecked.length}/${todayPlan.exs.length}`}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-side">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(todayChecked.length / todayPlan.exs.length) * 100}%`,
              background:
                'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 55%, #9065b0))',
            }}
          />
        </div>
      </section>

      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-soft">
        <Icon name="dumbbell" size={14} /> Haftalık Program
      </h2>
      <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        {PROGRAM.map((plan, i) => {
          const isToday = i === todayWd;
          const dayIso = (() => {
            const d = new Date();
            d.setDate(d.getDate() - todayWd + i);
            return isoOf(d);
          })();
          const checked = db.workouts[dayIso] ?? [];
          const allDone = plan.exs.every((e) => checked.includes(e.id));
          return (
            <section
              key={i}
              className={cx(
                'card p-3 transition-all md:p-4',
                isToday && !allDone && 'ring-2 ring-accent/40',
                allDone && 'ring-1 ring-emerald-500/30',
              )}
            >
              <div className="mb-2.5 flex items-center gap-2">
                <span
                  className={cx(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold',
                    isToday ? 'bg-accent text-white' : 'bg-hover text-soft',
                  )}
                >
                  {DAY_SHORT[i]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight">{plan.focus}</p>
                  <p className="truncate text-[11px] text-faint">{plan.tip}</p>
                </div>
                {allDone ? (
                  <span className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400">✓</span>
                ) : (
                  <span className="shrink-0 text-[11px] tabular-nums text-faint">
                    {checked.length}/{plan.exs.length}
                  </span>
                )}
              </div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                <span className={cx('rounded-full px-2 py-0.5 text-[10.5px] font-semibold', KIND_BADGE[plan.kind])}>
                  {KIND_LABEL[plan.kind]}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-hover px-2 py-0.5 text-[10.5px] font-medium text-soft">
                  <Icon name="clock" size={10} /> {plan.mins}
                </span>
                {isToday && (
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10.5px] font-semibold text-accent">
                    Bugün
                  </span>
                )}
              </div>
              <ul className="space-y-0.5">
                {plan.exs.map((ex) => {
                  const isChecked = checked.includes(ex.id);
                  return (
                    <li key={ex.id}>
                      <button
                        onClick={() => workouts.toggle(dayIso, ex.id)}
                        className="group flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-hover"
                      >
                        <span
                          className={cx(
                            'todo-check h-[18px] w-[18px] rounded-md',
                            isChecked && 'checked',
                          )}
                        >
                          {isChecked && <Icon name="check" size={11} />}
                        </span>
                        <span className={cx('min-w-0 flex-1 truncate text-[13px]', isChecked && 'text-faint')}>
                          {ex.name}
                        </span>
                        <span className="shrink-0 text-[11px] font-medium tabular-nums text-faint">{ex.target}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="mt-6 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        <section className="card p-3 md:p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-soft">
            <Icon name="flame" size={14} /> Altın kurallar
          </h3>
          <ul className="space-y-1.5 text-[13px] leading-relaxed">
            <li>💧 Günde <b>2,5–3 litre su</b> — şişeni al yanına</li>
            <li>😴 <b>8–9 saat uyku</b> — kas ve yağ yakımı burada olur</li>
            <li>🥤 Şekerli içecek ve paketli abur cubur eve gelmesin</li>
            <li>🚶 Günlük <b>6.000 → 10.000 adım</b>, her hafta +500</li>
            <li>⚖️ Tartı sadece <b>pazar sabahı</b>, aç karnına</li>
            <li>
              ❤️ Yürüyüşte nabız <b>{hrLow}–{hrHigh}</b> civarı olsun
            </li>
          </ul>
        </section>
        <section className="card p-3 md:p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-soft">
            <Icon name="activity" size={14} /> Nasıl ilerlersin?
          </h3>
          <ul className="space-y-1.5 text-[13px] leading-relaxed">
            <li><b>1.–2. hafta:</b> Yazan tekrarları rahat yapana dek aynen devam</li>
            <li><b>Sonrasında:</b> Her güç gününde +1 tekrar veya +5 sn ekle</li>
            <li>Rahatlaşınca duvar → masa kenarı → diz üstü pompa sırasına geç</li>
            <li>Yürüyüş sürelerini her 2 haftada 5 dk uzat</li>
          </ul>
          <p className="mt-3 rounded-lg bg-side px-3 py-2 text-xs leading-relaxed text-soft">
            Büyüme çağındasın: form bozulmasın, ağrı olursa dur, aşırı aç kalmadan beslen.
            Şüphedeysen ailenle/doktorunla paylaş. 💪
          </p>
        </section>
      </div>
    </div>
  );
}
