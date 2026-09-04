import { useEffect, useState } from 'react';
import { Icon } from '../lib/icons';
import { patchSettings, useDB } from '../lib/store';

export default function Files() {
  const db = useDB();
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(db.settings.filebrowserUrl);
  // URL değişince 5 sn timeout ile "yüklenemedi" durumunu sıfırla
  const [failed, setFailed] = useState(false);
  const currentUrl = db.settings.filebrowserUrl;
  useEffect(() => {
    const t = setTimeout(() => {
      setFailed(true);
    }, 5000);
    return () => {
      clearTimeout(t);
      setFailed(false);
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
      <div className="mx-auto w-full max-w-[1100px] px-4 pt-20 md:px-10 md:pt-10">
        <div className="mb-1 text-[26px] leading-none md:text-[34px] select-none">📁</div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold tracking-tight md:text-[32px]">Files</h1>
            <p className="mt-1 truncate text-sm text-soft">{db.settings.filebrowserUrl || '— adres gir —'}</p>
          </div>
          <div className="mt-1.5 flex shrink-0 gap-1.5">
            <button onClick={() => setEditing(!editing)} className="btn btn-ghost border border-line" aria-label="Edit address">
              <Icon name="pencil" size={14} />
            </button>
            {!urlIsEmpty && (
              <a href={db.settings.filebrowserUrl} target="_blank" rel="noreferrer" className="btn btn-ghost border border-line">
                <Icon name="upload" size={14} /> Tarayıcıda aç
              </a>
            )}
          </div>
        </div>

        {editing && (
          <form onSubmit={saveUrl} className="card mb-4 flex gap-2 p-3 animate-[pop-in_240ms_var(--ease-spring)]">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://192.168.1.200:5555"
              inputMode="url"
              className="field flex-1"
              autoFocus
            />
            <button type="submit" className="btn btn-primary">Save</button>
          </form>
        )}

        {urlIsEmpty && (
          <div className="card mb-4 p-4 text-center">
            <p className="text-sm font-medium">FileBrowser address is empty</p>
            <p className="mt-1 text-xs text-soft">
              Yukarıdaki kalem ikonuna tıklayıp adresi gir (e.g. http://192.168.1.200:5555).
            </p>
            <button onClick={() => setEditing(true)} className="btn btn-primary mt-3">
              <Icon name="pencil" size={14} /> Adresi gir
            </button>
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-[1100px] flex-1 px-4 pb-28 md:px-10 md:pb-6">
        <div className="card relative h-[calc(100dvh-260px)] min-h-[420px] overflow-hidden">
          {!urlIsEmpty && (
            <iframe
              key={db.settings.filebrowserUrl}
              src={db.settings.filebrowserUrl}
              title="FileBrowser"
              className={failed ? 'pointer-events-none invisible h-0 w-0' : 'h-full w-full border-0'}
              sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox"
            />
          )}
          {failed && !urlIsEmpty && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
              <p className="text-sm font-medium">Page failed to load</p>
              <p className="max-w-md text-xs text-soft">
                FileBrowser 5 saniye içinde yanıt vermedi. Server kapalı olabilir ya da
                adres yanlış. «Tarayıcıda aç» ile dene veya adresi kontrol et.
              </p>
              <a href={db.settings.filebrowserUrl} target="_blank" rel="noreferrer" className="btn btn-primary mt-1">
                <Icon name="upload" size={14} /> Tarayıcıda aç
              </a>
            </div>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-faint">
          Gömülü sayfa açılmazsa (sunucu izin vermezse) «Tarayıcıda aç» ile kullan.
        </p>
      </div>
    </div>
  );
}