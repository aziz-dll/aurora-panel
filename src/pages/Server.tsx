import { Page } from '../components/Page';
import { Icon } from '../lib/icons';
import { formatUptime } from '../lib/termux';
import { useSystemStats } from '../lib/useSystemStats';
import { cx } from '../lib/utils';

function MiniRing({
  percent,
  label,
  icon,
  color = 'var(--accent)',
  hint,
}: {
  percent: number;
  label: string;
  icon: 'cpu' | 'database' | 'layers' | 'flame';
  color?: string;
  hint?: string;
}) {
  const p = Math.max(0, Math.min(100, percent));
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c * (1 - p / 100);
  return (
    <div className="card flex flex-col items-center gap-1.5 p-3">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--line)" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke={color}
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
        <p className="flex items-center gap-1.5 text-[13px] font-medium">
          <Icon name={icon} size={13} /> {label}
        </p>
        {hint && <p className="text-[11px] text-faint">{hint}</p>}
      </div>
    </div>
  );
}

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-[13px] text-soft">{label}</span>
      <div className="text-right">
        <span className="font-mono text-[14px] tabular-nums">{value}</span>
        {sub && <span className="ml-1.5 text-[11px] text-faint">{sub}</span>}
      </div>
    </div>
  );
}

export default function Server() {
  const s = useSystemStats();
  const memPct = s.memory ? Math.round((s.memory.used / s.memory.total) * 100) : 0;

  return (
    <Page icon="🖥️" title="Server" subtitle="J7 Prime health">
      {!s.connected ? (
        <div className="card p-6 text-center">
          <p className="text-base font-medium">Termux API not connected</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-faint">
            For server statistics, install{' '}
            <code className="rounded bg-side px-1 py-0.5">pkg install termux-api</code> + the Termux:API
            app on J7 Prime, then start the server with{' '}
            <code className="rounded bg-side px-1 py-0.5">npm run start</code>.
          </p>
          <a href="#/settings" className="btn btn-primary mt-4 inline-flex">
            <Icon name="cog" size={14} /> Open settings
          </a>
        </div>
      ) : (
        <div className="space-y-5">
          <section>
            <h2 className="mb-2 text-sm font-semibold text-soft">System health</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MiniRing
                percent={s.cpu?.usage ?? 0}
                label="CPU"
                icon="cpu"
                color="#9065b0"
                hint={s.cpu ? `${s.cpu.cores} cores` : undefined}
              />
              <MiniRing
                percent={memPct}
                label="RAM"
                icon="database"
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
                    label="Storage"
                    icon="layers"
                    color="#0f7b6c"
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
                    label="SD"
                    icon="database"
                    color="#d9730d"
                    hint={sd ? `${sd.used.toFixed(1)} / ${sd.total.toFixed(1)} GB` : 'No SD card'}
                  />
                );
              })()}
            </div>
          </section>

          <section className="card p-4">
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-soft">
              <Icon name="zap" size={14} /> Device
            </h2>
            <div className="divide-y divide-line">
              <StatRow
                label="Model"
                value={s.info ? `${s.info.manufacturer} ${s.info.model}` : '—'}
                sub={s.info ? `Android ${s.info.android} (SDK ${s.info.sdk})` : undefined}
              />
              <StatRow label="Hostname" value={s.info?.hostname ?? '—'} />
              <StatRow
                label="Network"
                value={s.wifi?.ip ?? '—'}
                sub={s.wifi?.ssid ? `SSID: ${s.wifi.ssid}` : s.wifi?.ip ? 'WiFi connected' : undefined}
              />
              <StatRow
                label="Uptime"
                value={s.uptime ? formatUptime(s.uptime.seconds) : '—'}
                sub={s.uptime ? `Boot: ${new Date(s.uptime.bootISO).toLocaleString()}` : undefined}
              />
            </div>
          </section>

          <section className="card p-4">
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-soft">
              <Icon name="thermometer" size={14} /> Battery & temperature
            </h2>
            {s.thermal && s.thermal.zones.length > 0 ? (
              <div className="space-y-1.5">
                {s.thermal.zones.map((z) => {
                  const warn = z.tempC >= 45;
                  const hot = z.tempC >= 55;
                  return (
                    <div key={z.name} className="flex items-center justify-between text-[13px]">
                      <span className="text-soft">{z.name.replace(/^zone/, 'Zone ')}</span>
                      <span
                        className={cx(
                          'font-mono font-semibold tabular-nums',
                          hot ? 'text-[#e03e3e]' : warn ? 'text-[#d9730d]' : 'text-ink',
                        )}
                      >
                        {z.tempC.toFixed(1)} °C
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] text-faint">Waiting for temperature data…</p>
            )}
          </section>

          <section className="card p-4">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-soft">
              <Icon name="database" size={14} /> Storage breakdown
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
              if (!rom) return <p className="text-[13px] text-faint">Waiting for storage data…</p>;
              return (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* ROM: ring + bar yanyana */}
                  <div className="card flex items-center gap-3 p-3">
                    <div className="relative h-14 w-14 shrink-0">
                      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
                        <circle cx="32" cy="32" r={26} fill="none" stroke="var(--line)" strokeWidth="5" />
                        <circle
                          cx="32"
                          cy="32"
                          r={26}
                          fill="none"
                          stroke={(() => {
                            const p = Math.round((rom.used / rom.total) * 100);
                            return p > 85 ? '#e03e3e' : p > 70 ? '#d9730d' : 'var(--accent)';
                          })()}
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={2 * Math.PI * 26 * (1 - rom.used / rom.total)}
                        />
                      </svg>
                      <span className="absolute inset-0 grid place-items-center text-[11px] font-bold tabular-nums">
                        {Math.round((rom.used / rom.total) * 100)}%
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium">Internal (ROM)</p>
                      <p className="font-mono text-[11px] text-soft">
                        {rom.used.toFixed(1)} / {rom.total.toFixed(1)} GB
                      </p>
                      <p className="text-[10px] text-faint">{rom.fs} · {rom.mount}</p>
                    </div>
                  </div>
                  {/* SD: ring + bar yanyana (ya da boş) */}
                  {sd ? (
                    <div className="card flex items-center gap-3 p-3">
                      <div className="relative h-14 w-14 shrink-0">
                        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
                          <circle cx="32" cy="32" r={26} fill="none" stroke="var(--line)" strokeWidth="5" />
                          <circle
                            cx="32"
                            cy="32"
                            r={26}
                            fill="none"
                            stroke={sd.pct > 85 ? '#e03e3e' : sd.pct > 70 ? '#d9730d' : '#d9730d'}
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
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium">SD card (32 GB)</p>
                        <p className="font-mono text-[11px] text-soft">
                          {sd.used.toFixed(1)} / {sd.total.toFixed(1)} GB
                        </p>
                        <p className="text-[10px] text-faint">{sd.fs} · {sd.mount}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="card flex items-center justify-center p-3 text-center text-[12px] text-faint">
                      No SD card detected
                    </div>
                  )}
                </div>
              );
            })()}
          </section>

          {s.disk && s.disk.length > 0 && (
            <section className="card overflow-hidden p-0">
              <h2 className="flex items-center gap-1.5 px-4 pt-3 pb-2 text-sm font-semibold text-soft">
                <Icon name="database" size={14} /> All mount points
              </h2>
              <table className="w-full text-[12px]">
                <thead className="bg-side text-faint">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-medium">Mount</th>
                    <th className="px-3 py-1.5 text-right font-medium">Total</th>
                    <th className="px-3 py-1.5 text-right font-medium">Used</th>
                    <th className="px-3 py-1.5 text-right font-medium">Free</th>
                    <th className="px-3 py-1.5 text-right font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {s.disk.map((d) => (
                    <tr key={d.mount} className="border-t border-line">
                      <td className="px-3 py-1.5 font-mono">{d.mount}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{d.total.toFixed(1)} GB</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{d.used.toFixed(1)} GB</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-soft">{d.free.toFixed(1)} GB</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        <span
                          className={cx(
                            d.pct > 90 ? 'text-[#e03e3e]' : d.pct > 75 ? 'text-[#d9730d]' : 'text-soft',
                          )}
                        >
                          {d.pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <p className="text-center text-[11px] text-faint">
            Refreshes every 15 s · All data computed on the device (J7 Prime)
          </p>
        </div>
      )}
    </Page>
  );
}