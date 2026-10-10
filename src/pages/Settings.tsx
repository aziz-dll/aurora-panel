import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  { key: 'system', label: 'Sistem' },
  { key: 'light', label: 'Açık' },
  { key: 'dark', label: 'Koyu' },
];

function Section({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <section className="mb-4 md:mb-5">
      <h2 className="label-medium mb-2 flex items-center gap-1.5 text-on-surface-variant">
        <Icon name={icon} size={14} /> {title}
      </h2>
      <div className="m3-card p-2 md:p-3">{children}</div>
    </section>
  );
}

function Row({
  icon,
  label,
  hint,
  children,
  htmlFor,
}: {
  icon?: IconName;
  label: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="m3-list-item-static min-h-[3rem] px-1">
      {icon && (
        <span className="m3-list-avatar bg-surface-container-high text-on-surface-variant">
          <Icon name={icon} size={18} />
        </span>
      )}
      <label htmlFor={htmlFor} className="m3-list-lines cursor-pointer">
        <span className="m3-list-headline body-medium font-medium">{label}</span>
        {hint && <span className="m3-list-supporting">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function SwitchRow({ icon, checked, onChange, label, hint }: { icon: IconName; checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="m3-list-item-static m3-state min-h-[3rem] cursor-pointer px-1">
      <span className="m3-list-avatar bg-surface-container-high text-on-surface-variant">
        <Icon name={icon} size={18} />
      </span>
      <span className="m3-list-lines">
        <span className="m3-list-headline body-medium font-medium">{label}</span>
        {hint && <span className="m3-list-supporting">{hint}</span>}
      </span>
      <span className="m3-switch shrink-0">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="m3-switch-track" />
      </span>
    </label>
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

  const waterPct = ((db.settings.waterEveryHours - 1) / 3) * 100;

  return (
    <Page title="Ayarlar" subtitle="Paneli kendine göre ayarla — her şey cihazında saklanır.">
      {/* Profil */}
      <Section icon="person" title="Profil">
        <Row label="Ad" htmlFor="settings-name">
          <input
            id="settings-name"
            value={db.settings.studentName}
            onChange={(e) => patchSettings({ studentName: e.target.value })}
            placeholder="örn. Ali"
            className="field max-w-[220px]"
          />
        </Row>
      </Section>

      {/* Görünüm */}
      <Section icon="palette" title="Görünüm">
        <div className="space-y-3 p-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="body-medium font-medium">Tema</span>
            <div className="m3-segmented">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => patchSettings({ theme: t.key })}
                  className={cx('m3-segmented-btn', db.settings.theme === t.key && 'm3-segmented-selected')}
                  aria-pressed={db.settings.theme === t.key}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="body-medium font-medium">Vurgu rengi</span>
            <div className="flex gap-2">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => patchSettings({ accent: c })}
                  aria-label={`${c} rengi`}
                  className={cx(
                    'h-7 w-7 rounded-full transition-transform',
                    db.settings.accent === c ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-surface-container' : 'opacity-60 hover:opacity-100',
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Hatırlatıcılar */}
      <Section icon="notifications" title="Hatırlatıcılar">
        <div className="space-y-1">
          {!remindersAvailable() && (
            <p className="body-small m-1 rounded-[var(--md-shape-md)] bg-surface-container-low px-3 py-2 text-on-surface-variant">
              Bildirimler APK'da çalışır — tarayıcıda bu bölümün etkisi yoktur.
            </p>
          )}
          <SwitchRow
            icon="notificationAdd"
            checked={db.settings.remindersEnabled}
            onChange={(v) => {
              patchSettings({ remindersEnabled: v });
              if (v) void requestReminderPermission();
            }}
            label="Hatırlatıcılar açık"
            hint="Ödev, sınav, su ve antrenman bildirimleri"
          />
          {db.settings.remindersEnabled && (
            <Row label="Test bildirimi gönder" hint="1-2 saniye içinde gelmeli">
              <button
                onClick={async () => {
                  const ok = await sendTestNotification();
                  flash(ok ? 'Test bildirimi gönderildi ✓' : 'Bildirim izni yok ✗');
                }}
                className="m3-btn m3-btn-tonal"
              >
                <Icon name="bell" size={15} /> Gönder
              </button>
            </Row>
          )}
          {db.settings.remindersEnabled && permState === false && (
            <div className="m3-card m3-card-outlined m-1 border-error/60 bg-error-container text-on-error-container">
              <p className="body-medium font-semibold">Bildirim izni reddedildi</p>
              <p className="body-small mt-0.5 leading-relaxed">
                Android istemi bir kez reddedilince tekrar sormaz. Açmak için:{' '}
                <b>Telefon Ayarları → Uygulamalar → Aurora → Bildirimler → İzin ver</b>
              </p>
              <button
                onClick={async () => {
                  if (await requestReminderPermission()) setPermState(true);
                  else flash('Sistem istemi engellendi — telefon ayarlarından aç ✗');
                }}
                className="m3-btn m3-btn-filled mt-2"
              >
                Tekrar dene
              </button>
            </div>
          )}
          <div className={cx('space-y-1', !db.settings.remindersEnabled && 'pointer-events-none opacity-40')}>
            <div className="grid grid-cols-2 gap-3 p-1">
              <label className="space-y-1">
                <span className="label-large text-on-surface-variant">Ödev hatırlatma</span>
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
                <span className="label-large text-on-surface-variant">Sınav hatırlatma</span>
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
              <label className="space-y-1">
                <span className="label-large text-on-surface-variant">Hatırlatma saati</span>
                <input
                  type="time"
                  value={db.settings.reminderTime}
                  onChange={(e) => patchSettings({ reminderTime: e.target.value })}
                  className="field"
                />
              </label>
              <label className="space-y-1">
                <span className="label-large text-on-surface-variant">Sınav öncesi uyarı</span>
                <select
                  value={db.settings.examLeadMinutes}
                  onChange={(e) => patchSettings({ examLeadMinutes: Number(e.target.value) })}
                  className="field"
                >
                  <option value={15}>15 dakika önce</option>
                  <option value={30}>30 dakika önce</option>
                  <option value={45}>45 dakika önce</option>
                  <option value={60}>1 saat önce</option>
                  <option value={90}>1,5 saat önce</option>
                </select>
              </label>
            </div>

            <hr className="m3-divider m-2" />

            <SwitchRow
              icon="waterDrop"
              checked={db.settings.waterEnabled}
              onChange={(v) => patchSettings({ waterEnabled: v })}
              label="Su hatırlatıcısı"
              hint={`${db.settings.waterFrom}–${db.settings.waterTo} arası`}
            />
            {db.settings.waterEnabled && (
              <div className="px-3 pt-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="label-large text-on-surface-variant">Su içme aralığı</span>
                  <span className="body-small tabular-nums text-on-surface-variant">her {db.settings.waterEveryHours} saat</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={1}
                  value={db.settings.waterEveryHours}
                  onChange={(e) => patchSettings({ waterEveryHours: Number(e.target.value) })}
                  className="m3-slider"
                  style={{ ['--m3-fill' as string]: `${waterPct}%` }}
                  aria-label="Su hatırlatıcı aralığı (saat)"
                />
                <div className="flex justify-between body-small text-outline">
                  <span>1 sa</span>
                  <span>2 sa</span>
                  <span>3 sa</span>
                  <span>4 sa</span>
                </div>
              </div>
            )}
            <SwitchRow
              icon="fitnessCenter"
              checked={db.settings.workoutEnabled}
              onChange={(v) => patchSettings({ workoutEnabled: v })}
              label="Antrenman hatırlatıcısı"
              hint={`Her gün saat ${db.settings.workoutTime} — o gün antrenman yaptıysan gelmez`}
            />
            <div className="grid grid-cols-2 gap-3 p-1">
              <label className="space-y-1">
                <span className="label-large text-on-surface-variant">Antrenman saati</span>
                <input
                  type="time"
                  value={db.settings.workoutTime}
                  onChange={(e) => patchSettings({ workoutTime: e.target.value })}
                  className="field"
                />
              </label>
              <label className="space-y-1">
                <span className="label-large text-on-surface-variant">Su başlangıç / bitiş</span>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={db.settings.waterFrom}
                    onChange={(e) => patchSettings({ waterFrom: e.target.value })}
                    className="field"
                    aria-label="Su hatırlatıcı başlangıç"
                  />
                  <input
                    type="time"
                    value={db.settings.waterTo}
                    onChange={(e) => patchSettings({ waterTo: e.target.value })}
                    className="field"
                    aria-label="Su hatırlatıcı bitiş"
                  />
                </div>
              </label>
            </div>

            <hr className="m3-divider m-2" />

            <p className="label-medium px-3 pt-1 text-on-surface-variant">Bildirim kanalları</p>
            <SwitchRow
              icon="event"
              checked={db.settings.notifications.examChannel}
              onChange={(v) => patchSettings({ notifications: { ...db.settings.notifications, examChannel: v } })}
              label="Sınav hatırlatıcıları"
              hint="Yüksek öncelik — sınav öncesi ve sınav günü"
            />
            <SwitchRow
              icon="checkSquare"
              checked={db.settings.notifications.todoChannel}
              onChange={(v) => patchSettings({ notifications: { ...db.settings.notifications, todoChannel: v } })}
              label="Ödev hatırlatıcıları"
              hint="Yaklaşan teslim tarihleri"
            />
            <SwitchRow
              icon="waterDrop"
              checked={db.settings.notifications.waterChannel}
              onChange={(v) => patchSettings({ notifications: { ...db.settings.notifications, waterChannel: v } })}
              label="Su hatırlatıcısı"
              hint="Düşük öncelik — sessiz bildirim"
            />
            <SwitchRow
              icon="dumbbell"
              checked={db.settings.notifications.workoutChannel}
              onChange={(v) => patchSettings({ notifications: { ...db.settings.notifications, workoutChannel: v } })}
              label="Antrenman hatırlatıcısı"
              hint="Antrenman saati geldiğinde bildirir"
            />
          </div>
        </div>
      </Section>

      {/* Entegrasyonlar */}
      <Section icon="folder" title="Entegrasyonlar">
        <label className="block space-y-1 p-1" htmlFor="settings-filebrowser">
          <span className="label-large text-on-surface-variant">FileBrowser adresi</span>
          <input
            id="settings-filebrowser"
            value={db.settings.filebrowserUrl}
            onChange={(e) => patchSettings({ filebrowserUrl: e.target.value })}
            placeholder="http://192.168.1.200:5555"
            inputMode="url"
            className="field"
          />
          <span className="body-small text-on-surface-variant">«Dosyalar» sayfası bu adresi gömer.</span>
        </label>
      </Section>

      {/* Termux API */}
      <Section icon="zap" title="Termux API">
        <div className="space-y-2 p-1">
          <Row
            icon={up === false ? 'wifiOff' : 'wifi'}
            label={up === null ? 'Kontrol ediliyor…' : up ? 'Bağlı' : 'Bağlı değil'}
            hint={
              battery
                ? `Batarya %${battery.percent ?? '?'}${battery.charging ? ' · şarj oluyor' : ''}`
                : 'Bildirim, titreşim ve batarya için Termux:API'
            }
          >
            <span className="m3-chip h-7">
              <span
                className={cx(
                  'h-2 w-2 rounded-full',
                  up === null ? 'bg-outline-variant' : up ? 'bg-tertiary' : 'bg-outline',
                )}
              />
              {up === null ? '…' : up ? 'Çevrimiçi' : 'Çevrimdışı'}
            </span>
          </Row>

          <div className="grid grid-cols-2 gap-2 p-1">
            <button
              onClick={async () => flash((await termux.toast('Merhaba Termux!')) ? 'Toast gösterildi ✓' : 'Termux bağlı değil ✗')}
              className="m3-btn m3-btn-outlined justify-start"
            >
              <Icon name="alert" size={15} /> Test toast
            </button>
            <button
              onClick={async () => flash((await termux.vibrate(400)) ? 'Titretildi ✓' : 'Termux bağlı değil ✗')}
              className="m3-btn m3-btn-outlined justify-start"
            >
              <Icon name="zap" size={15} /> Titret
            </button>
            <button
              onClick={async () => flash((await termux.copy('Aurora panelinden selamlar 👋')) ? 'Kopyalandı ✓' : 'Termux bağlı değil ✗')}
              className="m3-btn m3-btn-outlined justify-start"
            >
              <Icon name="contentCopy" size={15} /> Panoya kopyala
            </button>
          </div>

          <p className="body-small rounded-[var(--md-shape-md)] bg-surface-container-low px-3 py-2.5 leading-relaxed text-on-surface-variant">
            Cihazda kurulum: <code className="rounded bg-surface-container-high px-1">pkg install termux-api</code> +{' '}
            <b>Termux:API</b> uygulaması (F-Droid). Sonra sunucuyu başlat:{' '}
            <code className="rounded bg-surface-container-high px-1">npm run build && npm run start</code> → tarayıcıda{' '}
            <code className="rounded bg-surface-container-high px-1">localhost:8788</code> adresini aç.
          </p>
        </div>
      </Section>

      {/* Veri */}
      <Section icon="download" title="Veri">
        <p className="body-small mb-3 px-1 text-on-surface-variant">
          Her şey cihazında saklanır — hesap yok, bulut yok.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={doExport} className="m3-btn m3-btn-outlined justify-start">
            <Icon name="download" size={15} /> Yedekle
          </button>
          <button onClick={() => fileRef.current?.click()} className="m3-btn m3-btn-outlined justify-start">
            <Icon name="upload" size={15} /> Geri yükle
          </button>
          <button
            onClick={() => {
              if (confirm('Tüm veriler örnek değerlere sıfırlanacak. Emin misin?')) {
                resetAll();
                flash('Sıfırlama tamamlandı');
              }
            }}
            className="m3-btn m3-btn-danger justify-start"
          >
            <Icon name="trash" size={15} /> Sıfırla
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

      {/* Snackbar geri bildirimi */}
      {feedback && (
        <div className="m3-snackbar" role="status">
          <Icon name={feedback.includes('✗') ? 'error' : 'checkCircle'} size={18} className="shrink-0" />
          <span className="body-medium min-w-0 flex-1">{feedback}</span>
          <button onClick={() => setFeedback('')} className="m3-btn m3-btn-text shrink-0 text-inverse-primary">
            Tamam
          </button>
        </div>
      )}
    </Page>
  );
}
