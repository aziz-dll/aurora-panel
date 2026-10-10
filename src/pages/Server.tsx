import { Page } from '../components/Page';
import { Icon, type IconName } from '../lib/icons';
import { formatUptime } from '../lib/termux';
import { useSystemStats } from '../lib/useSystemStats';
import { cx } from '../lib/utils';

function loadColor(p: number): string {
  if (p > 85) return 'var(--md-sys-color-error)';
  if (p > 70) return 'var(--md-sys-color-tertiary)';
  return 'var(--md-sys-color-primary)';
}

function MiniRing({
  percent,
  label,
  icon,
  hint,
}: {
  percent: number;
  label: string;
  icon: IconName;
  hint?: string;
}) {
  const p = Math.max(0, Math.min(100, percent));
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c * (1 - p / 100);
  return (
    <div className="m3-card m3-card-interactive flex flex-col items-center gap-1.5 p-3">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--md-sys-color-surface-container-highest)" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke={loadColor(p)}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={off}
            className="transition-all duration-500"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-sm font-bold tabular-nums">
          {Math.round(p)}%
        </span>
      </div>
      <div className="text-center">
        <p className="body-medium flex items-center justify-center gap-1.5 font-medium">
          <Icon name={icon} size={14} /> {label}
        </p>
        {hint && <p className="body-small text-on-surface-variant">{hint}</p>}
      </div>
    </div>
  );
}

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="body-small text-on-surface-variant">{label}</span>
      <div className="text-right">
        <span className="body-medium font-mono tabular-nums">{value}</span>
        {sub && <span className="body-small ml-1.5 text-on-surface-variant">{sub}</span>}
      </div>
    </div>
  );
}

export default function Server() {
  const s = useSystemStats();
  const memPct = s.memory ? Math.round((s.memory.used / s.memory.total) * 100) : 0;

  return (
    <Page title="Sunucu" subtitle="J7 Prime sağlık durumu">
      {!s.connected ? (
        <div className="m3-card p-6 text-center">
          <span className="m3-list-avatar mx-auto mb-3 h-12 w-12 bg-error-container text-on-error-container">
            <Icon name="wifiOff" size={24} />
          </span>
          <p className="title-medium">Termux API bağlı değil</p>
          <p className="body-small mt-1.5 leading-relaxed text-on-surface-variant">
            Sunucu istatistikleri için J7 Prime üzerinde{' '}
            <code className="rounded bg-surface-container-high px-1 py-0.5">pkg install termux-api</code> + Termux:API
            uygulamasını kur, sonra sunucuyu{' '}
            <code className="rounded bg-surface-container-high px-1 py-0.5">npm run start</code> ile başlat.
          </p>
          <a href="#/settings" className="m3-btn m3-btn-filled mt-4">
            <Icon name="cog" size={16} /> Ayarları aç
          </a>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Sistem sağlığı */}
          <section>
            <h2 className="title-medium mb-2 text-on-surface-variant">Sistem sağlığı</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MiniRing
                percent={s.cpu?.usage ?? 0}
                label="CPU"
                icon="cpu"
                hint={s.cpu ? `${s.cpu.cores} çekirdek` : undefined}
              />
              <MiniRing
                percent={memPct}
                label="RAM"
                icon="memory"
                hint={s.memory ? `${s.memory.used.toFixed(0)} / ${s.memory.total.toFixed(0)} MB` : undefined}
              />
              {(() => {
                const rom =
                  s.disk?.find((d) => d.mount === '/') ??
                  s.disk?.find((d) => d.mount === '/data') ??
                  s.disk
                    ?.filter((d) => !/^\/(sdcard|storage|emulated)/i.test(d.mount))
                    .sort((a, b) => b.total - a.total)[0];
                const romPct = rom && rom.total > 0 ? Math.min(100, Math.round((rom.used / rom.total) * 100)) : 0;
                return (
                  <MiniRing
                    percent={romPct}
                    label="Depolama"
                    icon="sdCard"
                    hint={rom ? `${rom.used.toFixed(1)} / ${rom.total.toFixed(1)} GB` : undefined}
                  />
                );
              })()}
              {(() => {
                const sd = s.disk?.find(
                  (d) => /sdcard|extSdCard|storage\/[a-f0-9-]{8}/i.test(d.mount) && d.total > 1,
                );
                return (
                  <MiniRing
                    percent={sd?.pct ?? 0}
                    label="SD kart"
                    icon="sdCard"
                    hint={sd ? `${sd.used.toFixed(1)} / ${sd.total.toFixed(1)} GB` : 'SD kart yok'}
                  />
                );
              })()}
            </div>
          </section>

          {/* Cihaz */}
          <section className="m3-card p-4">
            <h2 className="title-medium mb-2 flex items-center gap-1.5 text-on-surface-variant">
              <Icon name="smartphone" size={16} /> Cihaz
            </h2>
            <div className="divide-y divide-outline-variant">
              <StatRow
                label="Model"
                value={s.info ? `${s.info.manufacturer} ${s.info.model}` : '—'}
                sub={s.info ? `Android ${s.info.android} (SDK ${s.info.sdk})` : undefined}
              />
              <StatRow label="Host adı" value={s.info?.hostname ?? '—'} />
              <StatRow
                label="Ağ"
                value={s.wifi?.ip ?? '—'}
                sub={s.wifi?.ssid ? `SSID: ${s.wifi.ssid}` : s.wifi?.ip ? 'WiFi bağlı' : undefined}
              />
              <StatRow
                label="Çalışma süresi"
                value={s.uptime ? formatUptime(s.uptime.seconds) : '—'}
                sub={s.uptime ? `Açılış: ${new Date(s.uptime.bootISO).toLocaleString('tr-TR')}` : undefined}
              />
            </div>
          </section>

          {/* Batarya ve sıcaklık */}
          <section className="m3-card p-4">
            <h2 className="title-medium mb-2 flex items-center gap-1.5 text-on-surface-variant">
              <Icon name="deviceThermostat" size={16} /> Batarya ve sıcaklık
            </h2>
            {s.battery && (
              <div className="m3-list-item-static mb-2 bg-surface-container-low">
                <span className="m3-list-avatar bg-secondary-container text-on-secondary-container">
                  <Icon name={s.battery.charging ? 'batteryChargingFull' : 'batteryFull'} size={20} />
                </span>
                <span className="m3-list-lines">
                  <span className="m3-list-headline body-medium font-medium">Batarya %{s.battery.percent ?? '?'}</span>
                  <span className="m3-list-supporting">{s.battery.charging ? 'Şarj oluyor' : 'Bataryada'}</span>
                </span>
              </div>
            )}
            {s.thermal && s.thermal.zones.length > 0 ? (
              <div className="space-y-1.5">
                {s.thermal.zones.map((z) => {
                  const warn = z.tempC >= 45;
                  const hot = z.tempC >= 55;
                  return (
                    <div key={z.name} className="flex items-center justify-between body-small">
                      <span className="text-on-surface-variant">{z.name.replace(/^zone/, 'Bölge ')}</span>
                      <span
                        className={cx(
                          'font-mono font-semibold tabular-nums',
                          hot ? 'text-error' : warn ? 'text-tertiary' : 'text-on-surface',
                        )}
                      >
                        {z.tempC.toFixed(1)} °C
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="body-small text-on-surface-variant">Sıcaklık verisi bekleniyor…</p>
            )}
          </section>

          {/* Depolama dağılımı */}
          <section className="m3-card p-4">
            <h2 className="title-medium mb-3 flex items-center gap-1.5 text-on-surface-variant">
              <Icon name="storage" size={16} /> Depolama dağılımı
            </h2>
            {(() => {
              const rom =
                s.disk?.find((d) => d.mount === '/') ??
                s.disk?.find((d) => d.mount === '/data') ??
                s.disk
                  ?.filter((d) => !/^\/(sdcard|storage|emulated)/i.test(d.mount))
                  .sort((a, b) => b.total - a.total)[0];
              const sd = s.disk?.find(
                (d) => /sdcard|extSdCard|storage\/[a-f0-9-]{8}/i.test(d.mount) && d.total > 1,
              );
              if (!rom) return <p className="body-small text-on-surface-variant">Depolama verisi bekleniyor…</p>;
              const romPct = Math.round((rom.used / rom.total) * 100);
              return (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="m3-card m3-card-outlined flex items-center gap-3 p-3">
                    <div className="relative h-14 w-14 shrink-0">
                      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
                        <circle cx="32" cy="32" r={26} fill="none" stroke="var(--md-sys-color-surface-container-highest)" strokeWidth="5" />
                        <circle
                          cx="32"
                          cy="32"
                          r={26}
                          fill="none"
                          stroke={loadColor(romPct)}
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={2 * Math.PI * 26 * (1 - rom.used / rom.total)}
                        />
                      </svg>
                      <span className="absolute inset-0 grid place-items-center text-[11px] font-bold tabular-nums">
                        {romPct}%
                      </span>
                    </div>
                    <div className="m3-list-lines">
                      <p className="body-small font-medium">Dahili (ROM)</p>
                      <p className="body-small font-mono text-on-surface-variant">
                        {rom.used.toFixed(1)} / {rom.total.toFixed(1)} GB
                      </p>
                      <div className="m3-progress mt-1 h-1">
                        <div className="m3-progress-bar" style={{ width: `${romPct}%`, background: loadColor(romPct) }} />
                      </div>
                      <p className="body-small mt-1 text-outline">{rom.fs} · {rom.mount}</p>
                    </div>
                  </div>
                  {sd ? (
                    <div className="m3-card m3-card-outlined flex items-center gap-3 p-3">
                      <div className="relative h-14 w-14 shrink-0">
                        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
                          <circle cx="32" cy="32" r={26} fill="none" stroke="var(--md-sys-color-surface-container-highest)" strokeWidth="5" />
                          <circle
                            cx="32"
                            cy="32"
                            r={26}
                            fill="none"
                            stroke={loadColor(sd.pct)}
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 26}
                            strokeDashoffset={2 * Math.PI * 26 * (1 - sd.pct / 100)}
                          />
                        </svg>
                        <span className="absolute inset-0 grid place-items-center text-[11px] font-bold tabular-nums">
                          {sd.pct}%
                        </span>
                      </div>
                      <div className="m3-list-lines">
                        <p className="body-small font-medium">SD kart</p>
                        <p className="body-small font-mono text-on-surface-variant">
                          {sd.used.toFixed(1)} / {sd.total.toFixed(1)} GB
                        </p>
                        <div className="m3-progress mt-1 h-1">
                          <div className="m3-progress-bar" style={{ width: `${sd.pct}%`, background: loadColor(sd.pct) }} />
                        </div>
                        <p className="body-small mt-1 text-outline">{sd.fs} · {sd.mount}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="m3-card m3-card-outlined flex items-center justify-center p-3 text-center body-small text-on-surface-variant">
                      SD kart algılanmadı
                    </div>
                  )}
                </div>
              );
            })()}
          </section>

          {/* Tüm bağlama noktaları */}
          {s.disk && s.disk.length > 0 && (
            <section className="m3-card overflow-hidden p-0">
              <h2 className="title-medium flex items-center gap-1.5 px-4 pt-3 pb-2 text-on-surface-variant">
                <Icon name="layers" size={16} /> Tüm bağlama noktaları
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead className="bg-surface-container-low text-on-surface-variant">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-medium">Bağlama</th>
                      <th className="px-3 py-1.5 text-right font-medium">Toplam</th>
                      <th className="px-3 py-1.5 text-right font-medium">Kullanılan</th>
                      <th className="px-3 py-1.5 text-right font-medium">Boş</th>
                      <th className="px-3 py-1.5 text-right font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.disk.map((d) => (
                      <tr key={d.mount} className="border-t border-outline-variant">
                        <td className="px-3 py-1.5 font-mono">{d.mount}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{d.total.toFixed(1)} GB</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{d.used.toFixed(1)} GB</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-on-surface-variant">{d.free.toFixed(1)} GB</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          <span className={cx(d.pct > 90 ? 'text-error' : d.pct > 75 ? 'text-tertiary' : 'text-on-surface-variant')}>
                            {d.pct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <p className="body-small text-center text-on-surface-variant">
            Her 15 saniyede yenilenir · Tüm veriler cihazda (J7 Prime) hesaplanır
          </p>
        </div>
      )}
    </Page>
  );
}
