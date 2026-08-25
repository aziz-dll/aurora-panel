# aurora-panel

Türkçe, tamamen lokal (localStorage) çalışan öğrenci paneli. React 19 + Tailwind CSS 4 + TypeScript + Vite, Capacitor ile Android APK'sına dönüştürülür.

## Komutlar

- Geliştirme: `npm run dev`
- Derleme: `npm run build` (tsc -b + vite build)
- Lint: `npm run lint` (oxlint)

## Mimari

- **Veri katmanı** (`src/lib/store.ts`): tek kaynaklı `DB` nesnesi, `useSyncExternalStore` ile reaktif; `updateDB` ile mutasyon, localStorage'a persist. Anahtar: `okul-paneli.v1`.
- **Aksiyonlar** (`src/lib/actions.ts`): todos/lessons/courses/exams/notes/workouts CRUD.
- **UI kiti** (`src/components/ui/`): 21st.dev/Magic UI tarzı bileşenler — `AuroraText`, `BlurFade`, `MagicCard`, `ShimmerButton`, `NumberTicker`, `Dock`, `BorderBeam`, `DotPattern`/`GridPattern`, `TextAnimate`, `AnimatedList`, `Ripple`, `AuroraBackground`. Animasyonlar `motion` paketiyle.
- **Tema**: CSS değişkenleri (`--paper`, `--ink`, `--accent`...) `.dark` sınıfıyla değişir; vurgu rengi ayarlardan `--accent`/`--accent-soft`'a yazılır. Tailwind utility'leri (`card`, `btn`, `field`, `glass`, `todo-check`, `strike`) `src/index.css` içinde `@utility` olarak tanımlı.
- **Navigasyon**: hash tabanlı (`#/` ... `#/ayarlar`); masaüstünde cam `Sidebar` (motion `layoutId` pill), mobilde altta `DockNav`.
- `vite.config.ts` içinde `server.allowedHosts: true` (sandbox/preview hostları için) ve `/api` → `127.0.0.1:8788` proxy (Termux köprü sunucusu `server.mjs`).
