import { useState } from 'react';
import { Icon } from '../lib/icons';
import { patchSettings, useDB } from '../lib/store';

export default function Files() {
  const db = useDB();
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(db.settings.filebrowserUrl);

  const saveUrl = () => {
    const v = url.trim();
    if (!v) return;
    const origin = /^https?:\/\//i.test(v) ? v : `http://${v}`;
    patchSettings({ filebrowserUrl: origin });
    setEditing(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-[1100px] px-4 pt-4 md:px-10 md:pt-10">
        <div className="mb-1 text-[26px] leading-none md:text-[38px] select-none">📁</div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight md:text-[32px]">Dosyalar</h1>
            <p className="mt-1 truncate text-sm text-soft">{db.settings.filebrowserUrl}</p>
          </div>
          <div className="mt-1.5 flex shrink-0 gap-1.5">
            <button onClick={() => setEditing(!editing)} className="btn btn-ghost border border-line" aria-label="Adresi düzenle">
              <Icon name="pencil" size={14} />
            </button>
            <a href={db.settings.filebrowserUrl} target="_blank" rel="noreferrer" className="btn btn-ghost border border-line">
              <Icon name="upload" size={14} /> Tarayıcıda aç
            </a>
          </div>
        </div>

        {editing && (
          <form onSubmit={saveUrl} className="card mb-4 flex gap-2 p-3">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://192.168.1.200:5555"
              inputMode="url"
              className="field flex-1"
              autoFocus
            />
            <button type="submit" className="btn btn-primary">Kaydet</button>
          </form>
        )}
      </div>

      <div className="mx-auto w-full max-w-[1100px] flex-1 px-4 pb-6 md:px-10">
        <div className="card h-[calc(100dvh-260px)] min-h-[420px] overflow-hidden">
          <iframe
            src={db.settings.filebrowserUrl}
            title="FileBrowser"
            className="h-full w-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-popups"
          />
        </div>
        <p className="mt-2 text-center text-xs text-faint">
          Gömülü sayfa açılmazsa (sunucu izin vermezse) «Tarayıcıda aç» ile kullan.
        </p>
      </div>
    </div>
  );
}
