import { useMemo } from 'react';
import { Page } from '../components/Page';
import { Icon } from '../lib/icons';
import { workouts } from '../lib/actions';
import { PROGRAM, isoOf, wdOf, dayDone, computeStreak, type Kind } from '../lib/fitness';
import { TR_DAYS_SHORT } from '../lib/tr';
import { patchSettings, useDB } from '../lib/store';
import { cx } from '../lib/utils';

const KIND_LABEL: Record<Kind, string> = { strength: 'Kuvvet', cardio: 'Kardiyo', recovery: 'Toparlanma' };

const KIND_CLS: Record<Kind, string> = {
  strength: 'bg-primary-container text-on-primary-container',
  cardio: 'bg-tertiary-container text-on-tertiary-container',
  recovery: 'bg-surface-container-highest text-on-surface-variant',
};

function Stat({ icon, value, label }: { icon: 'localFireDepartment' | 'calendarDays' | 'emojiEvents'; value: string; label: string }) {
  return (
    <div className="m3-card flex items-center gap-3">
      <span className="m3-list-avatar bg-secondary-container text-on-secondary-container">
        <Icon name={icon} size={20} />
      </span>
      <div className="min-w-0">
        <div className="headline-small leading-tight tabular-nums">{value}</div>
        <div className="body-small truncate text-on-surface-variant">{label}</div>
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
  const bmiColor = bmi >= 30 ? 'var(--md-sys-color-error)' : bmi >= 25 ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-primary)';

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
  const progress = (todayChecked.length / todayPlan.exs.length) * 100;

  const numField = (label: string, unit: string, value: number, key: 'weightKg' | 'heightCm' | 'ageYears') => (
    <label className="block">
      <span className="label-large mb-1 block text-on-surface-variant">
        {label} {unit && <span className="text-outline">({unit})</span>}
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
    <Page title="Fitness" subtitle="Ekipmansız ev programı — kilo, boy ve yaşına göre ayarlı.">
      {/* Vücut ölçüleri */}
      <section className="m3-card mb-4 p-3 md:p-4">
        <h2 className="title-medium mb-3 flex items-center gap-1.5 text-on-surface-variant">
          <Icon name="target" size={16} /> Ölçüleri
        </h2>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <div className="w-24">{numField('Kilo', 'kg', weight, 'weightKg')}</div>
          <div className="w-24">{numField('Boy', 'cm', height, 'heightCm')}</div>
          <div className="w-24">{numField('Yaş', '', age, 'ageYears')}</div>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative h-14 w-14 shrink-0" role="img" aria-label={`Vücut kitle indeksi ${bmi.toFixed(1)}`}>
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--md-sys-color-surface-container-highest)" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke={bmiColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(bmi, 40) * 2.43}, 100`}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-[11px] font-bold tabular-nums">{bmi.toFixed(1)}</span>
            </div>
            <div className="body-small leading-relaxed text-on-surface-variant">
              <p className="title-small text-on-surface">VKİ {bmi.toFixed(1)}</p>
              <p>
                İdeal aralık: <b>{idealMin}–{idealMax} kg</b>
              </p>
              <p className="text-outline">Haftada 0,5 kg vermek yeterli 🐢</p>
            </div>
          </div>
        </div>
      </section>

      {/* Özet istatistikler */}
      <section className="mb-4 grid grid-cols-3 gap-3 max-sm:gap-2">
        <Stat icon="localFireDepartment" value={`${streak}`} label="Seri (gün)" />
        <Stat icon="calendarDays" value={`${weekDone}`} label="Bu hafta / 7" />
        <Stat icon="emojiEvents" value={`${totalDone}`} label="Toplam tamamlanan" />
      </section>

      {/* Bugünün antrenmanı */}
      <section className="m3-card m3-card-filled mb-6 p-3 md:p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="title-small min-w-0 truncate">
            Bugün: {TR_DAYS_SHORT[todayWd]} — {todayPlan.focus}
          </span>
          <span
            className={cx(
              'm3-chip h-7 shrink-0',
              todayAllDone ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-container-highest text-on-surface-variant',
            )}
          >
            {todayAllDone ? 'Tamamlandı ✓' : `${todayChecked.length}/${todayPlan.exs.length}`}
          </span>
        </div>
        <div className="m3-progress">
          <div
            className="m3-progress-bar"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--md-sys-color-primary), var(--md-sys-color-tertiary))' }}
          />
        </div>
      </section>

      <h2 className="title-medium mb-2 flex items-center gap-1.5 text-on-surface-variant">
        <Icon name="dumbbell" size={16} /> Haftalık program
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
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
                'm3-card p-3 md:p-4',
                isToday && !allDone && 'ring-2 ring-primary',
                allDone && 'ring-1 ring-tertiary',
              )}
            >
              <div className="mb-2.5 flex items-center gap-2">
                <span
                  className={cx(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-[var(--md-shape-sm)] text-[11px] font-bold',
                    isToday ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant',
                  )}
                >
                  {TR_DAYS_SHORT[i]}
                </span>
                <div className="m3-list-lines">
                  <p className="m3-list-headline title-small">{plan.focus}</p>
                  <p className="m3-list-supporting">{plan.tip}</p>
                </div>
                {allDone ? (
                  <span className="shrink-0 text-title-small text-tertiary">✓</span>
                ) : (
                  <span className="shrink-0 body-small tabular-nums text-on-surface-variant">
                    {checked.length}/{plan.exs.length}
                  </span>
                )}
              </div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                <span className={cx('m3-chip h-6 px-2 text-[11px]', KIND_CLS[plan.kind])}>{KIND_LABEL[plan.kind]}</span>
                <span className="m3-chip m3-chip-input h-6 px-2 text-[11px]">
                  <Icon name="clock" size={11} /> {plan.mins}
                </span>
                {isToday && (
                  <span className="m3-chip h-6 bg-primary-container px-2 text-[11px] text-on-primary-container">Bugün</span>
                )}
              </div>
              <ul className="space-y-0.5">
                {plan.exs.map((ex) => {
                  const isChecked = checked.includes(ex.id);
                  return (
                    <li key={ex.id}>
                      <button
                        onClick={() => workouts.toggle(dayIso, ex.id)}
                        className="m3-list-item min-h-[2.5rem] px-1.5 py-1"
                        aria-pressed={isChecked}
                      >
                        <span className={cx('todo-check h-[18px] w-[18px] rounded-[var(--md-shape-xs)]', isChecked && 'checked')}>
                          {isChecked && <Icon name="check" size={11} />}
                        </span>
                        <span className={cx('m3-list-headline text-[13px]', isChecked && 'text-on-surface-variant line-through')}>
                          {ex.name}
                        </span>
                        <span className="m3-list-trailing font-medium tabular-nums">{ex.target}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <section className="m3-card p-3 md:p-4">
          <h3 className="title-medium mb-2 flex items-center gap-1.5 text-on-surface-variant">
            <Icon name="localFireDepartment" size={16} /> Altın kurallar
          </h3>
          <ul className="space-y-1.5 text-[13px] leading-relaxed">
            <li>💧 Günde <b>2,5–3 L su</b> iç — su şişesini hep yanımda tut</li>
            <li>😴 <b>8–9 saat uyku</b> — kas ve yağ kaybı burada olur</li>
            <li>🥤 Evde şekerli içecek ve paketli atıştırmalık yok</li>
            <li>🚶 Günlük <b>6.000 → 10.000 adım</b>, her hafta +500</li>
            <li>⚖️ Tartılma sadece <b>Pazar sabahı</b>, aç karnına</li>
            <li>
              ❤️ Yürüyüşte nabız <b>{hrLow}–{hrHigh}</b> civarı
            </li>
          </ul>
        </section>
        <section className="m3-card p-3 md:p-4">
          <h3 className="title-medium mb-2 flex items-center gap-1.5 text-on-surface-variant">
            <Icon name="activity" size={16} /> Nasıl ilerlersin?
          </h3>
          <ul className="space-y-1.5 text-[13px] leading-relaxed">
            <li><b>1–2. haftalar:</b> Tekrarlar kolaylaşana kadar aynı sayıda kal</li>
            <li><b>İlerleme:</b> Her kuvvet gününde +1 tekrar veya +5 sn</li>
            <li>Kolaylaşınca zorlaştır: duvar → masa kenarı → diz üstü şınav</li>
            <li>Yürüyüşleri her 2 haftada 5 dk uzat</li>
          </ul>
          <p className="body-small mt-3 rounded-[var(--md-shape-md)] bg-surface-container-low px-3 py-2 leading-relaxed text-on-surface-variant">
            Büyüme çağındasın: form bozulmasın, ağrı olursa dur, aşırı aç kalmadan beslen. Şüphedeysen ailenle/doktorunla paylaş. 💪
          </p>
        </section>
      </div>
    </Page>
  );
}
