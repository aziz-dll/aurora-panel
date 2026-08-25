# aurora-panel

Türkçe, tamamen lokal (localStorage) çalışan öğrenci paneli. React 19 + Tailwind CSS 4 + TypeScript + Vite, Capacitor ile Android APK'sına dönüştürülür.

## Komutlar

- Geliştirme: `npm run dev`
- Derleme: `npm run build` (tsc -b + vite build)
- Lint: `npm run lint` (oxlint)

## Mimari

- **Veri katmanı** (`src/lib/store.ts`): tek kaynaklı `DB` nesnesi, `useSyncExternalStore` ile reaktif; `updateDB` ile mutasyon, localStorage'a persist. Anahtar: `okul-paneli.v1`.
- **Aksiyonlar** (`src/lib/actions.ts`): todos/lessons/courses/exams/notes/workouts CRUD.
- **Tasarım**: Hafif, özel yazılmış UI — animasyon kütüphanesi yok. CSS geçişleri ve birkaç keyframe (`page-in`, `pop-in`, `fade-in`, `check-draw`, `aurora-shift`) `src/index.css` içinde. Utility sınıfları (`card`, `btn`, `field`, `glass`, `todo-check`, `strike`, `card-lift`) yine aynı dosyada `@utility` olarak tanımlı.
- **Tema**: CSS değişkenleri (`.dark` sınıfı); vurgu rengi ayarlardan `--accent`/`--accent-soft`'a yazılır.
- **Navigasyon**: hash tabanlı; masaüstünde `Sidebar`, mobilde altta `DockNav` (saf CSS geçişli).
- `vite.config.ts` içinde `server.allowedHosts: true` ve `/api` → `127.0.0.1:8788` proxy (Termux köprü sunucusu `server.mjs`).

## Not

Ağır animasyon kütüphaneleri (motion/framer vb.) bilinçli olarak kullanılmıyor — uygulama düşük güçlü cihazlarda (Termux üzerinde çalışan telefon) akıcı kalsın diye. Yeni görsel efekt eklerken CSS transition/animation tercih et.
