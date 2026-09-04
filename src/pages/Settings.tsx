import { useEffect, useRef, useState } from 'react';
import { Page } from '../components/Page';
import { Icon, type IconName } from '../lib/icons';
import { exportJSON, importJSON, patchSettings, resetAll, useDB } from '../lib/store';
import { hasReminderPermission, requestReminderPermission, remindersAvailable, sendTestNotification } from '../lib/reminders';
import { termux } from '../lib/termux';
import type { ThemeMode } from '../lib/types';
import { useTermuxStatus } from '../lib/useTermuxStatus';
import { cx } from '../lib/utils';

const ACCENTS = ['#2383e2', '#9065b0', '#0f7b6c', '#d9730d', '#e03e3e', '#c14c8a'];

const THEMES: Array<{ key: ThemeMode; label: string }> = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

function Section({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 md:mb-7">
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-soft">
        <Icon name={icon} size={14} /> {title}
      </h2>
      <div className="card p-3 md:p-4">{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative h-6 w-10 shrink-0 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-faint/40')}
      >
        <span
          className={cx(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
            checked && 'translate-x-4',
          )}
        />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {hint && <p className="mt-0.5 text-xs leading-snug text-faint">{hint}</p>}
      </div>
    </div>
  );
}

export default function Settings() {
  const db = useDB();
  const { connected, battery } = useTermuxStatus();
  const [feedback, setFeedback] = useState('');
  const [permState, setPermState] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const up = connected;

  useEffect(() => {
    void (async () => {
      if (db.settings.remindersEnabled && remindersAvailable()) {
        setPermState(await hasReminderPermission());
      } else {
        setPermState(null);
      }
    })();
  }, [db.settings.remindersEnabled]);

  const flash = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 2500);
  };

  const doExport = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aurora-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash('Backup downloaded ✓');
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (importJSON(String(reader.result))) flash('Backup restored ✓');
      else flash('Could not read file ✗');
    };
    reader.readAsText(file);
  };

  return (
    <Page icon="⚙️" title="Settings" subtitle={feedback || undefined}>
      <Section icon="star" title="Profile">
        <label className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-sm text-soft">Name</span>
          <input
            value={db.settings.studentName}
            onChange={(e) => patchSettings({ studentName: e.target.value })}
            placeholder="e.g. Alex"
            className="field"
          />
        </label>
      </Section>

      <Section icon="sun" title="Appearance">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm text-soft">Theme</span>
            <div className="flex gap-1 rounded-lg bg-side p-1">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => patchSettings({ theme: t.key })}
                  className={cx(
                    'rounded-md px-3 py-1 text-xs transition-colors',
                    db.settings.theme === t.key ? 'bg-paper font-medium shadow-[var(--shadow-card)]' : 'text-soft hover:text-ink',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm text-soft">Accent</span>
            <div className="flex gap-2">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => patchSettings({ accent: c })}
                  aria-label={`Color ${c}`}
                  className={cx(
                    'h-6 w-6 rounded-full transition-transform',
                    db.settings.accent === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-paper' : 'opacity-60 hover:opacity-100',
                  )}
                  style={{ background: c, ...(db.settings.accent === c ? ({ '--tw-ring-color': c }) as React.CSSProperties : {}) }}
                />
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section icon="bell" title="Reminders">
        <div className="space-y-4">
          {!remindersAvailable() && (
            <p className="rounded-lg bg-side px-3 py-2 text-xs text-soft">
              Notifications work in the APK — in the browser this section has no effect.
            </p>
          )}
          <Toggle
            checked={db.settings.remindersEnabled}
            onChange={(v) => {
              patchSettings({ remindersEnabled: v });
              if (v) void requestReminderPermission();
            }}
            label="Reminders on"
            hint="Homework, exam, water and workout notifications"
          />
          {db.settings.remindersEnabled && (
            <button
              onClick={async () => {
                const ok = await sendTestNotification();
                flash(ok ? 'Test notification sent — should arrive in 1-2 s ✓' : 'No notification permission ✗');
              }}
              className="btn btn-ghost border border-line justify-start"
            >
              <Icon name="bell" size={14} /> Send test notification
            </button>
          )}
          {db.settings.remindersEnabled && permState === false && (
            <div className="rounded-lg bg-[#fae4e4] px-3 py-2.5 text-xs leading-relaxed text-[#621f1f] dark:bg-[#40222a] dark:text-[#ef8b8b]">
              <p className="font-semibold">Notification permission denied 🔕</p>
              <p className="mt-0.5">
                Once Android blocks the prompt it won't ask again. To enable:{' '}
                <b>Phone Settings → Apps → Aurora → Notifications → Allow</b>
              </p>
              <button
                onClick={async () => {
                  if (await requestReminderPermission()) setPermState(true);
                  else setFeedback('System prompt is blocked — open phone settings to enable ✗');
                }}
                className="btn mt-2 border border-current px-2.5 py-1 text-xs font-medium"
              >
                Try again
              </button>
            </div>
          )}
          <div className={cx('space-y-3', !db.settings.remindersEnabled && 'pointer-events-none opacity-40')}>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-soft">Remind homework</span>
                <select
                  value={db.settings.todoReminderDays}
                  onChange={(e) => patchSettings({ todoReminderDays: Number(e.target.value) })}
                  className="field"
                >
                  <option value={1}>1 day before</option>
                  <option value={2}>2 days before</option>
                  <option value={3}>3 days before</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-soft">Remind exam</span>
                <select
                  value={db.settings.examReminderDays}
                  onChange={(e) => patchSettings({ examReminderDays: Number(e.target.value) })}
                  className="field"
                >
                  <option value={3}>3 days before</option>
                  <option value={7}>1 week before</option>
                  <option value={14}>2 weeks before</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-soft">Reminder time</span>
                <input
                  type="time"
                  value={db.settings.reminderTime}
                  onChange={(e) => patchSettings({ reminderTime: e.target.value })}
                  className="field"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-soft">Lead time before exam</span>
                <select
                  value={db.settings.examLeadMinutes}
                  onChange={(e) => patchSettings({ examLeadMinutes: Number(e.target.value) })}
                  className="field"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                </select>
              </label>
            </div>
            <div className="space-y-3 border-t border-line pt-3">
              <Toggle
                checked={db.settings.waterEnabled}
                onChange={(v) => patchSettings({ waterEnabled: v })}
                label="💧 Water reminder"
                hint={`${db.settings.waterFrom}–${db.settings.waterTo}, every ${db.settings.waterEveryHours}h`}
              />
              <Toggle
                checked={db.settings.workoutEnabled}
                onChange={(v) => patchSettings({ workoutEnabled: v })}
                label="🏋️ Workout reminder"
                hint={`Every day at ${db.settings.workoutTime} — skipped if you already trained`}
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-soft">Workout time</span>
                  <input
                    type="time"
                    value={db.settings.workoutTime}
                    onChange={(e) => patchSettings({ workoutTime: e.target.value })}
                    className="field"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-soft">Water every</span>
                  <select
                    value={db.settings.waterEveryHours}
                    onChange={(e) => patchSettings({ waterEveryHours: Number(e.target.value) })}
                    className="field"
                  >
                    <option value={1}>1 hour</option>
                    <option value={2}>2 hours</option>
                    <option value={3}>3 hours</option>
                    <option value={4}>4 hours</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-soft">Water from</span>
                  <input
                    type="time"
                    value={db.settings.waterFrom}
                    onChange={(e) => patchSettings({ waterFrom: e.target.value })}
                    className="field"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-soft">Water until</span>
                  <input
                    type="time"
                    value={db.settings.waterTo}
                    onChange={(e) => patchSettings({ waterTo: e.target.value })}
                    className="field"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-soft">All reminders at</span>
                  <input
                    type="time"
                    value={db.settings.reminderTime}
                    onChange={(e) => patchSettings({ reminderTime: e.target.value })}
                    className="field"
                  />
                </label>
              </div>
            </div>
            <div className="space-y-3 border-t border-line pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">Notification channels</p>
              <Toggle
                checked={db.settings.notifications.examChannel}
                onChange={(v) => patchSettings({ notifications: { ...db.settings.notifications, examChannel: v } })}
                label="📝 Exam reminders"
                hint="High priority — before exam and on exam day"
              />
              <Toggle
                checked={db.settings.notifications.todoChannel}
                onChange={(v) => patchSettings({ notifications: { ...db.settings.notifications, todoChannel: v } })}
                label="⏳ Homework reminders"
                hint="Approaching deadlines"
              />
              <Toggle
                checked={db.settings.notifications.waterChannel}
                onChange={(v) => patchSettings({ notifications: { ...db.settings.notifications, waterChannel: v } })}
                label="💧 Water reminder"
                hint="Low priority — silent notification"
              />
              <Toggle
                checked={db.settings.notifications.workoutChannel}
                onChange={(v) => patchSettings({ notifications: { ...db.settings.notifications, workoutChannel: v } })}
                label="🏋️ Workout reminder"
                hint="Notifies when it's workout time"
              />
            </div>
          </div>
        </div>
      </Section>

      <Section icon="clipboard" title="Integrations">
        <label className="space-y-1">
          <span className="text-sm text-soft">FileBrowser URL</span>
          <input
            value={db.settings.filebrowserUrl}
            onChange={(e) => patchSettings({ filebrowserUrl: e.target.value })}
            placeholder="http://192.168.1.200:5555"
            inputMode="url"
            className="field"
          />
        </label>
        <p className="mt-2 text-xs text-faint">The «Files» page embeds the FileBrowser at this address.</p>
      </Section>

      <Section icon="zap" title="Termux API">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="relative flex h-2 w-2">
                {up === true && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
                <span
                  className={cx(
                    'relative inline-flex h-2 w-2 rounded-full',
                    up === null ? 'bg-faint' : up ? 'bg-emerald-500' : 'bg-zinc-400 opacity-50',
                  )}
                />
              </span>
              {up === null ? 'Checking…' : up ? 'Connected' : 'Not connected'}
              {battery && (
                <span className="text-xs text-faint">
                  · Battery {battery.percent ?? '?'}%{battery.charging ? ' ⚡' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={async () => flash((await termux.toast('Hello Termux!')) ? 'Toast shown ✓' : 'Termux not connected ✗')}
              className="btn btn-ghost border border-line justify-start"
            >
              <Icon name="alert" size={14} /> Test toast
            </button>
            <button
              onClick={async () => flash((await termux.vibrate(400)) ? 'Vibrated ✓' : 'Termux not connected ✗')}
              className="btn btn-ghost border border-line justify-start"
            >
              <Icon name="zap" size={14} /> Vibrate
            </button>
            <button
              onClick={async () => flash((await termux.copy('Greetings from the school panel 👋')) ? 'Copied ✓' : 'Termux not connected ✗')}
              className="btn btn-ghost border border-line justify-start"
            >
              <Icon name="clipboard" size={14} /> Copy to clipboard
            </button>
          </div>

          <p className="rounded-lg bg-side px-3 py-2.5 text-xs leading-relaxed text-soft">
            On the device, install: <code className="rounded bg-hover px-1 py-0.5">pkg install termux-api</code> +{' '}
            the <b>Termux:API</b> app (F-Droid). Then start the server:{' '}
            <code className="rounded bg-hover px-1 py-0.5">npm run build &amp;&amp; npm run start</code> → open{' '}
            <code className="rounded bg-hover px-1 py-0.5">localhost:8788</code> in a browser.
          </p>
        </div>
      </Section>

      <Section icon="download" title="Data">
        <p className="mb-3 text-xs text-soft">Everything is stored on your device — no accounts, no cloud.</p>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={doExport} className="btn btn-ghost border border-line justify-start">
            <Icon name="download" size={14} /> Backup
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn btn-ghost border border-line justify-start">
            <Icon name="upload" size={14} /> Restore
          </button>
          <button
            onClick={() => {
              if (confirm('All data will be reset to sample values. Are you sure?')) {
                resetAll();
                flash('Reset complete');
              }
            }}
            className="btn justify-start text-[#e03e3e] hover:bg-[#fae4e4] dark:hover:bg-[#40222a]"
          >
            <Icon name="trash" size={14} /> Reset
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) doImport(f);
            e.target.value = '';
          }}
        />
      </Section>
    </Page>
  );
}