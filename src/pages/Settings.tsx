import { useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '../lib/icons';
import { exportJSON, importJSON, patchSettings, resetAll, useDB } from '../lib/store';
import { hasReminderPermission, requestReminderPermission, remindersAvailable, sendTestNotification } from '../lib/reminders';
import { termux } from '../lib/termux';
import type { ThemeMode } from '../lib/types';
import { useTermuxStatus } from '../lib/useTermuxStatus';
import { cx } from '../lib/utils';

const ACCENTS = ['#2383e2', '#9065b0', '#0f7b6c', '#d9730d', '#e03e3e', '#c14c8a'];

const THEMES: Array<{ key: ThemeMode; label: string }> = [
  { key: 'system', label: 'Sistem' },
  { key: 'light', label: 'Açık' },
  { key: 'dark', label: 'Koyu' },
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
  const [manualPing, setManualPing] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState('');
  const [permState, setPermState] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const up = manualPing ?? connected;

  useEffect(() => {
    if (db.settings.remindersEnabled && remindersAvailable()) {
      void hasReminderPermission().then(setPermState);
    } else {
      setPermState(null);
    }
  }, [db.settings.remindersEnabled]);

  const flash = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 2500);
  };

  const checkConnection = async () => {
    const p = await termux.ping();
    setManualPing(p?.termux === true);
  };

  const doExport = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aurora-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash('Yedek indirildi ✓');
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (importJSON(String(reader.result))) flash('Yedek geri yüklendi ✓');
      else flash('Dosya okunamadı ✗');
    };
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 pb-28 pt-4 md:px-10 md:pb-16 md:pt-10">
      <div className="mb-1 text-[26px] leading-none md:text-[38px] select-none">⚙️</div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight md:text-[32px]">Ayarlar</h1>
          {feedback && <p className="mt-1 text-sm font-medium text-accent">{feedback}</p>}
        </div>
      </div>

      <Section icon="star" title="Profil">
        <label className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-sm text-soft">Adın</span>
          <input
            value={db.settings.studentName}
            onChange={(e) => patchSettings({ studentName: e.target.value })}
            placeholder="örn. Ali"
            className="field"
          />
        </label>
      </Section>

      <Section icon="sun" title="Görünüm">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm text-soft">Tema</span>
            <div className="flex gap-1 rounded-lg bg-side p-1">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => patchSettings({ theme: t.key })}
                  className={cx(
                    'btn px-3 py-1 text-xs',
                    db.settings.theme === t.key ? 'bg-paper shadow-[var(--shadow-card)] font-medium' : 'text-soft',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm text-soft">Vurgu rengi</span>
            <div className="flex gap-2">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => patchSettings({ accent: c })}
                  aria-label={`Renk ${c}`}
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

      <Section icon="bell" title="Hatırlatıcılar">
        <div className="space-y-4">
          {!remindersAvailable() && (
            <p className="rounded-lg bg-side px-3 py-2 text-xs text-soft">
              Bildirimler APK'da çalışır — tarayıcıda bu bölüm etkisizdir.
            </p>
          )}
          <Toggle
            checked={db.settings.remindersEnabled}
            onChange={(v) => patchSettings({ remindersEnabled: v })}
            label="Hatırlatıcılar açık"
            hint="Ödev, yazılı, su ve spor bildirimleri"
          />
          {db.settings.remindersEnabled && (
            <button
              onClick={async () => {
                const ok = await sendTestNotification();
                flash(ok ? 'Test bildirimi gönderildi — 1-2 sn içinde düşecek ✓' : 'Bildirim izni yok ✗');
              }}
              className="btn btn-ghost border border-line justify-start"
            >
              <Icon name="bell" size={14} /> Test bildirimi gönder
            </button>
          )}
          {db.settings.remindersEnabled && permState === false && (
            <div className="rounded-lg bg-[#fae4e4] px-3 py-2.5 text-xs leading-relaxed text-[#621f1f] dark:bg-[#40222a] dark:text-[#ef8b8b]">
              <p className="font-semibold">Bildirim izni kapalı 🔕</p>
              <p className="mt-0.5">
                Android bir kez reddedilince tekrar soramaz. Açmak için:{' '}
                <b>Telefon Ayarları → Uygulamalar → Aurora → Bildirimler → İzin ver</b>
              </p>
              <button
                onClick={async () => {
                  if (await requestReminderPermission()) setPermState(true);
                  else setFeedback('Sistem izin penceresi vermiyor — telefon ayarlarından aç ✗');
                }}
                className="btn mt-2 border border-current px-2.5 py-1 text-xs font-medium"
              >
                Tekrar dene
              </button>
            </div>
          )}
          <div className={cx('space-y-3', !db.settings.remindersEnabled && 'pointer-events-none opacity-40')}>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-soft">Ödevi kaç gün önce hatırlat</span>
                <select
                  value={db.settings.todoReminderDays}
                  onChange={(e) => patchSettings({ todoReminderDays: Number(e.target.value) })}
                  className="field"
                >
                  <option value={1}>1 gün önce</option>
                  <option value={2}>2 gün önce</option>
                  <option value={3}>3 gün önce</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-soft">Yazılıyı kaç gün önce hatırlat</span>
                <select
                  value={db.settings.examReminderDays}
                  onChange={(e) => patchSettings({ examReminderDays: Number(e.target.value) })}
                  className="field"
                >
                  <option value={3}>3 gün önce</option>
                  <option value={7}>1 hafta önce</option>
                  <option value={14}>2 hafta önce</option>
                </select>
              </label>
            </div>
            <div className="space-y-3 border-t border-line pt-3">
              <Toggle
                checked={db.settings.waterEnabled}
                onChange={(v) => patchSettings({ waterEnabled: v })}
                label="💧 Su hatırlatması"
                hint={`${db.settings.waterFrom}–${db.settings.waterTo} arası, ${db.settings.waterEveryHours} saatte bir`}
              />
              <Toggle
                checked={db.settings.workoutEnabled}
                onChange={(v) => patchSettings({ workoutEnabled: v })}
                label="🏋️ Spor hatırlatması"
                hint={`Her gün ${db.settings.workoutTime} — o gün yaptıysan gelmez`}
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-soft">Spor saati</span>
                  <input
                    type="time"
                    value={db.settings.workoutTime}
                    onChange={(e) => patchSettings({ workoutTime: e.target.value })}
                    className="field"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-soft">Su kaç saatte bir</span>
                  <select
                    value={db.settings.waterEveryHours}
                    onChange={(e) => patchSettings({ waterEveryHours: Number(e.target.value) })}
                    className="field"
                  >
                    <option value={1}>1 saat</option>
                    <option value={2}>2 saat</option>
                    <option value={3}>3 saat</option>
                    <option value={4}>4 saat</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section icon="clipboard" title="Entegrasyonlar">
        <label className="space-y-1">
          <span className="text-sm text-soft">FileBrowser adresi</span>
          <input
            value={db.settings.filebrowserUrl}
            onChange={(e) => patchSettings({ filebrowserUrl: e.target.value })}
            placeholder="http://192.168.1.200:5555"
            inputMode="url"
            className="field"
          />
        </label>
        <p className="mt-2 text-xs text-faint">«Dosyalar» sayfası bu adresteki FileBrowser'ı gömer.</p>
      </Section>

      <Section icon="zap" title="Termux API">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span
                className={cx(
                  'h-2 w-2 rounded-full',
                  up === null ? 'bg-faint' : up ? 'bg-emerald-500' : 'bg-zinc-400 opacity-50',
                )}
              />
              {up === null ? 'Kontrol ediliyor…' : up ? 'Bağlı' : 'Bağlı değil'}
              {battery && (
                <span className="text-xs text-faint">
                  · Batarya %{battery.percent ?? '?'}{battery.charging ? ' ⚡' : ''}
                </span>
              )}
            </div>
            <button onClick={() => void checkConnection()} className="btn btn-ghost border border-line p-1.5" aria-label="Yenile">
              <Icon name="refresh" size={13} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={async () => flash((await termux.notify('Aurora 🎒', 'Termux bildirimi çalışıyor!')) ? 'Bildirim gönderildi ✓' : 'Termux bağlı değil ✗')}
              className="btn btn-ghost border border-line justify-start"
            >
              <Icon name="bell" size={14} /> Bildirim testi
            </button>
            <button
              onClick={async () => flash((await termux.toast('Merhaba Termux!')) ? 'Toast gösterildi ✓' : 'Termux bağlı değil ✗')}
              className="btn btn-ghost border border-line justify-start"
            >
              <Icon name="alert" size={14} /> Toast testi
            </button>
            <button
              onClick={async () => flash((await termux.vibrate(400)) ? 'Titredi ✓' : 'Termux bağlı değil ✗')}
              className="btn btn-ghost border border-line justify-start"
            >
              <Icon name="zap" size={14} /> Titret
            </button>
            <button
              onClick={async () => flash((await termux.copy('Okul panelinden selamlar 👋')) ? 'Panoya kopyalandı ✓' : 'Termux bağlı değil ✗')}
              className="btn btn-ghost border border-line justify-start"
            >
              <Icon name="clipboard" size={14} /> Panoya yaz
            </button>
          </div>

          <p className="rounded-lg bg-side px-3 py-2.5 text-xs leading-relaxed text-soft">
            Cihazda çalıştırmak için: <code className="rounded bg-hover px-1 py-0.5">pkg install termux-api</code> +{' '}
            <b>Termux:API</b> uygulaması (F-Droid). Sonra sunucuyu başlat:{' '}
            <code className="rounded bg-hover px-1 py-0.5">npm run build && npm run start</code> → tarayıcıdan{' '}
            <code className="rounded bg-hover px-1 py-0.5">localhost:8788</code>
          </p>
        </div>
      </Section>

      <Section icon="download" title="Veri">
        <p className="mb-3 text-xs text-soft">Her şey cihazında saklanır — hesap yok, bulut yok.</p>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={doExport} className="btn btn-ghost border border-line justify-start">
            <Icon name="download" size={14} /> Yedekle
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn btn-ghost border border-line justify-start">
            <Icon name="upload" size={14} /> Geri yükle
          </button>
          <button
            onClick={() => {
              if (confirm('Tüm veriler örnek verilere sıfırlanacak. Emin misin?')) {
                resetAll();
                flash('Sıfırlandı');
              }
            }}
            className="btn justify-start text-[#e03e3e] hover:bg-[#fae4e4] dark:hover:bg-[#40222a]"
          >
            <Icon name="trash" size={14} /> Sıfırla
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
    </div>
  );
}
