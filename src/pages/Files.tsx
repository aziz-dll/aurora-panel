import { useEffect, useRef, useState } from 'react';
import { Icon } from '../lib/icons';
import { patchSettings, useDB } from '../lib/store';

export default function Files() {
  const db = useDB();
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(db.settings.filebrowserUrl);
  // URL değişince 5 sn timeout ile "yüklenemedi" durumunu sıfırla
  const [failed, setFailed] = useState(false);
  const failTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUrl = db.settings.filebrowserUrl;

  useEffect(() => {
    setFailed(false);
    if (failTimer.current) clearTimeout(failTimer.current);
    if (!currentUrl.trim()) return;
    failTimer.current = setTimeout(() => setFailed(true), 5000);
    return () => {
      if (failTimer.current) clearTimeout(failTimer.current);
      failTimer.current = null;
    };
  }, [currentUrl]);

  const saveUrl = () => {
    const v = url.trim();
    if (!v) return;
    const origin = /^https?:\/\//i.test(v) ? v : `http://${v}`;
    patchSettings({ filebrowserUrl: origin });
    setEditing(false);
  };

  const urlIsEmpty = !db.settings.filebrowserUrl.trim();

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-[1100px] px-4 pt-6 md:px-10 md:pt-8">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="headline-medium tracking-tight">Dosyalar</h1>
            <p className="body-medium mt-1 truncate text-on-surface-variant">
              {db.settings.filebrowserUrl || 'FileBrowser adresi girilmedi'}
            </p>
          </div>
          <div className="mt-1 flex shrink-0 gap-1">
            <button
              onClick={() => {
                setUrl(db.settings.filebrowserUrl);
                setEditing(!editing);
              }}
              className="m3-icon-btn"
              aria-label="Adresi düzenle"
            >
              <Icon name="pencil" size={20} />
            </button>
            {!urlIsEmpty && (
              <a
                href={db.settings.filebrowserUrl}
                target="_blank"
                rel="noreferrer"
                className="m3-btn m3-btn-outlined"
                aria-label="Tarayıcıda aç"
              >
                <Icon name="openInNew" size={16} /> Tarayıcıda aç
              </a>
            )}
          </div>
        </div>

        {editing && (
          <form onSubmit={saveUrl} className="m3-card m3-card-outlined mb-4 flex gap-2 p-3 animate-[pop-in_240ms_var(--ease-spring)]">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://192.168.1.200:5555"
              inputMode="url"
              className="field flex-1"
              autoFocus
              aria-label="FileBrowser adresi"
            />
            <button type="submit" className="m3-btn m3-btn-filled">Kaydet</button>
          </form>
        )}

        {urlIsEmpty && (
          <div className="m3-card mb-4 p-6 text-center">
            <span className="m3-list-avatar mx-auto mb-3 h-12 w-12 bg-secondary-container text-on-secondary-container">
              <Icon name="folder" size={24} />
            </span>
            <p className="title-medium">FileBrowser adresi boş</p>
            <p className="body-small mt-1 text-on-surface-variant">
              Kalem ikonuna dokunup adresi gir (örn. http://192.168.1.200:5555).
            </p>
            <button onClick={() => setEditing(true)} className="m3-btn m3-btn-filled mt-4">
              <Icon name="pencil" size={16} /> Adres gir
            </button>
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-[1100px] flex-1 px-4 pb-28 md:px-10 md:pb-6">
        <div className="m3-card relative h-[calc(100vh-260px)] min-h-[420px] overflow-hidden p-0">
          {!urlIsEmpty && (
            <iframe
              key={db.settings.filebrowserUrl}
              src={db.settings.filebrowserUrl}
              title="FileBrowser"
              onLoad={() => {
                if (failTimer.current) clearTimeout(failTimer.current);
                failTimer.current = null;
                setFailed(false);
              }}
              className={failed ? 'pointer-events-none invisible h-0 w-0' : 'h-full w-full border-0'}
              sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox"
            />
          )}
          {failed && !urlIsEmpty && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
              <span className="m3-list-avatar h-12 w-12 bg-error-container text-on-error-container">
                <Icon name="cloudOff" size={24} />
              </span>
              <p className="title-medium mt-2">Sayfa yüklenemedi</p>
              <p className="body-small max-w-md text-on-surface-variant">
                FileBrowser 5 saniye içinde yanıt vermedi. Sunucu kapalı olabilir ya da adres yanlış.
                «Tarayıcıda aç» ile dene veya adresi kontrol et.
              </p>
              <a href={db.settings.filebrowserUrl} target="_blank" rel="noreferrer" className="m3-btn m3-btn-filled mt-2">
                <Icon name="openInNew" size={16} /> Tarayıcıda aç
              </a>
            </div>
          )}
        </div>
        <p className="body-small mt-2 text-center text-on-surface-variant">
          Gömülü sayfa açılmazsa (sunucu izin vermezse) «Tarayıcıda aç» ile kullan.
        </p>
      </div>
    </div>
  );
}
