# Aurora Panel — 7 Sorun Düzeltmesi

## 1. Todo/Exam Bildirimleri Hatırlatılmıyor (KÖK NEDEN DÜZELTMESİ)

**Sorun**: `apk-loader/index.html:113-117` `plusDaysISO()` `toISOString()` (UTC) kullanıyor, `daysUntil()` ise local midnight kullanıyor. Türkiye (UTC+3) için 3-saat kayma yaratıyor; gece yarısı–03:00 arası hesaplanan `at` geçmişe denk geliyor, `if (at <= now) return` bildirimi atlıyor. Bu yüzden **todo/exam bildirimleri schedule edilmiyor** (sadece su/spor — onlar saat-tabanlı, date arithmetic'e bağlı değil).

**Düzeltme**:
- `apk-loader/index.html` `plusDaysISO` → local-temel (yıl/ay/gün `getFullYear/getMonth/getDate` ile).
- `src/lib/reminders.ts` `plusDaysISO` (varsa) → aynı düzeltme.
- **`examChannel` ve `todoChannel` toggle'ları aktif edilsin**: `buildDrafts` ve `scheduleAll` içinde `s.notifications.todoChannel === false` ise todo draft'larını atla (aynısı exam için). Şu an toggle'lar DB'ye yazılıyor ama **hiç okunmuyor** — dekoratif.
- **`syncKey`'e todos hash'i ekle** (`App.tsx`): `JSON.stringify(db.todos.map(t => [t.id, t.done, t.due, t.title]))` → tarih değişiklikleri de sync tetiklesin.

## 2. Emoji'leri Icon Olarak Kullanma

- Tüm emoji-as-icon yerlerini **Lucide-style SVG icon**'a çevir. Mevcut `src/lib/icons.tsx` zaten SVG icon seti içeriyor; eksik olanları ekle (menu, x, sun, moon, search, bell, calendar, star, download, upload, clock, zap, alert, clipboard, dumbbell, flame, drop, target, activity, more, arrowUpRight, edit, check, trash, chevronDown, chevronRight, arrowLeft, plus).
- **Yer değiştirilecek emoji'ler**:
  - Drawer/Hamburger: `📁 ⚙️` → `Icon name="menu"`
  - **NOT**: Sayfa **etiketleri** (Sol taraftaki "Panel/Görevler/Program/..." metinleri) kalabilir — onlar zaten metin, emoji değil. Emoji olarak görünen **tek yer icon**'lar.
  - Settings'teki `Icon name="star"`, `Icon name="sun"`, `Icon name="bell"`, `Icon name="clipboard"`, `Icon name="zap"`, `Icon name="download"`, `Icon name="upload"`, `Icon name="trash"` zaten SVG — onlara dokunma.
- **Yeni eklenecek icon'lar** (icons.tsx): `gauge` (CPU/sunucu), `database` (disk), `cpu` (chip), `thermometer` (sıcaklık), `wifi`, `layoutGrid` (Panel), `listChecks` (Görevler), `calendarDays` (Program), `graduationCap` (Öğrenci), `dumbbell` (Spor — var), `repeat` (Alışkanlıklar), `stickyNote` (Notlar), `folderOpen` (Dosyalar), `server` (Sunucu), `sliders` (Ayarlar — yerine `cog`).
- Sidebar/DockNav item emoji'leri (🏠 ✅ 📅 🎓 🏋️ 🔁 📝 📁 🖥️ ⚙️) zaten **label değil** — drawer'da metnin yanında ikon. Bunları da Lucide SVG'ye çevir. (Emoji menülerde label'in parçası olarak da kullanılıyordu — bu kullanımı tamamen kaldırıp sadece SVG icon bırakacağım.)

## 3. Hamburger Menü + Sidebar/DockNav Kaldırma

**Zaten `src/components/TopBar.tsx`'te tam fonksiyonel hamburger drawer var** (slide-in, backdrop, ESC, X button, link tıklayınca otomatik kapanma). Yapılacak:
- `src/components/Sidebar.tsx` — tamamen sil (md+ layout'ta kullanılıyordu).
- `src/components/DockNav.tsx` — tamamen sil (mobil bottom dock'tu).
- `src/App.tsx:130` civarı layout'u sadeleştir: Sidebar import + render kaldır, DockNav import + render kaldır, içerik alanı tam genişlik olur.
- Hamburger butonu TopBar'da zaten sol üst köşede (`☰`) — kullanıcının "sol köşeye" dediği bu.
- Nav yapısı gruplu kalır (General/Personal/System) — 10+ item flat olunca karışır.

## 4. Server Sayfası ROM Barı Düzeltmesi

Şu an ROM barı yüzde gösteriyor ama GB karışık. Yeni yapı:
- **MiniRing ROM**: ortada büyük yüzde, altında "ROM" yazısı, hint'te "8.2 / 16 GB".
- **Bar'lar yan yana**: ROM bar + SD kart bar yatayda, her birinin altında açıklama:
  - ROM: `8.2 / 16 GB (%51)` + çubuk
  - SD kart: `12.4 / 28.6 GB (%43)` + çubuk (32 GB nominal ≈ 28.6 usable)
- **df tablosunda** zaten detay var — oraya dokunma.
- Mevcut "Detaylı bar" kartı zaten 2 ayrı `<Bar>` bileşeni render ediyor — sıralamayı "ROM (dahili) | SD kart" şeklinde dikey tut, üstte ROM önce.

## 5. Habits Sayfası (HabitKit Feature Parity)

**Zaten `src/pages/Habits.tsx` ve `src/lib/actions.ts:160-192` (habits action'ları) var**, sadece polish + build/quit iki yönlülük + takvim grid eksik.

**Eksik özellikler (HabitKit'ten)**:
1. **Build + Quit tipi**: Her habit `type: 'build' | 'quit'`. Build = her gün "evet yaptım", Quit = her gün "hayır, kaydım". UI'da toggle farklı renklerde.
2. **Tile-based streak grid**: 7×N haftalık ızgara, her gün bir kare (✓ yeşil, ✗ kırmızı quit için, boş gri). Bugünün karesi vurgulu.
3. **Frequency**: daily / X per week / X per month. `frequency: { type, target?: number }`.
4. **Calendar view**: Geçmiş günleri tıkla, ekle/çıkar.
5. **Reminders**: per-habit notification time.
6. **Archive**: archived habit'ler ayrı bölümde, restore edilebilir.
7. **Renk + ikon**: Her habit için renk seçici ve Lucide icon seçici (emoji DEĞİL).

**Mimari**:
- `src/lib/types.ts` — `Habit { id, name, type: 'build'|'quit', frequency, color, icon, reminder?, archived }`, `HabitLog = Record<habitId, Record<dateISO, boolean>>`.
- `src/lib/actions.ts` — `habits.add/remove/toggle/archive/restore` (mevcut genişletilebilir).
- `src/pages/Habits.tsx` — yeniden yaz (tam HabitKit stili).

## 6. Tüm Arayüz İngilizce

**Strateji: inline çeviri (i18n kütüphanesi yok)**. Mevcut uygulama tek dilli, hiçbir ayar/locale mantığı yok. i18next/react-intl eklemek YAGNI.

**Çevrilecek dosyalar** (~120 string):
- `src/pages/Dashboard.tsx` (greeting, "Bugünkü ders", "Açık görev", vb.)
- `src/pages/Todos.tsx` (filtreler, "Burada görünecek görev yok", form placeholder)
- `src/pages/Schedule.tsx` (gün isimleri zaten İngilizce — `DAY_NAMES` hardcoded Türkçe, çevrilecek; uyarı mesajları)
- `src/pages/Student.tsx` ("Not Ekle", "Sınav Ekle", "Devamsızlık")
- `src/pages/Notes.tsx` ("Bu not silinsin mi?", placeholder, "Henüz not yok")
- `src/pages/Fitness.tsx` (egzersiz adları opsiyonel — kendi antrenman programın)
- `src/pages/Settings.tsx` (Türkçe section başlıkları, hint metinleri)
- `src/pages/Server.tsx` ("Sistem sağlığı", "Cihaz bilgisi", "Depolama")
- `src/pages/Habits.tsx` (zaten İngilizce yazılmış)
- `src/components/Dialog.tsx` (`aria-label="Close"`)
- `src/components/TermuxBadge.tsx` ("Batarya", "Termux API kapalı")
- `src/lib/store.ts` (seed: welcome note, varsayılan todo/lesson adları)
- `src/lib/utils.ts` (`DAY_NAMES` → `['Monday', 'Tuesday', ...]`)
- `src/lib/serverBattery.ts` (bildirim title/body)

`date-fns` zaten `enUS` locale ile çalışıyor (utils.ts:2) — tarih formatları otomatik İngilizce olacak.

## 7. Android Homescreen Widget'lar

**Mevcut skeleton** (`android/app/src/main/java/com/gh0st/okulpaneli/widgets/`):
- `TodosWidget.java`, `BatteryWidget.java`, `ScheduleWidget.java` — hepsi hardcoded placeholder basıyor
- Manifest kayıtlı, layout'lar var, `widgetSync.ts` no-op
- `syncWidgets` fonksiyonu import var ama `App.tsx`'te çağrılmıyor

**Yapılacak** (3 widget, genişletilebilir altyapı):

**Faz 1 — Veri köprüsünü kur** (tüm widget'lar için temel):
1. **JS → Native veri yazma**: `src/lib/widgetSync.ts`'i tamamla. `Capacitor.Plugins.Filesystem.writeFile({ path: 'widget-data.json', data: JSON.stringify(data), directory: 'DATA' })` veya Capacitor plugin yaz. Daha kolay: mevcut `@capacitor/filesystem` (yüklü değilse ekle) veya sadece `fetch` ile native HTTP endpoint'e yaz (kötü). **En basit**: native tarafta `SharedPreferences` kullanan küçük bir Capacitor plugin yaz (~50 satır Java + ~30 satır TS).
   - Bu plugin `read(key)` ve `write(key, jsonString)` sunsun.
   - JS `buildWidgetData(db)` ile JSON hazırla, plugin.write('widgetData', json).
2. **Native okuma**: Her `AppWidgetProvider.onUpdate()` içinde `SharedPreferences`'ten JSON oku, `JSONObject` parse et, `RemoteViews.setTextViewText(R.id.title, ...)` / `setTextViewText(R.id.body, ...)` ile widget UI'ını güncelle.
3. **Trigger**: `App.tsx`'te `useEffect` ile `syncWidgets(getDB())` çağır (syncKey değişince) + `MainActivity` açılışında `AppWidgetManager.getAppWidgetIds(...)` ile aktif widget'ları update et.

**Faz 2 — 3 widget için veri + UI**:
- **ServerWidget** (priority 1 — kullanıcı özellikle istedi): pil % + Termux bağlı/offline + küçük RAM/ROM bar. Layout: 2×2 small.
- **TodosWidget**: açık todo sayısı + ilk 3 başlık. Layout: 4×3 large (ListView olmadan, 3 statik satır + "..." göstergesi).
- **ScheduleWidget**: bugünkü dersler (max 3 satır: saat + isim). Layout: 4×2 medium.

**Kapsam dışı** (ayrı PR): Dosyalar, Spor, Notlar, Alışkanlıklar widget'ları (altyapı kurulduktan sonra kolayca eklenir).

**Plugin implementasyonu** (AuroraPlugin.java):
```java
@CapacitorPlugin(name = "AuroraStorage")
public class AuroraStoragePlugin extends Plugin {
  @PluginMethod public void write(PluginCall call) {
    String key = call.getString("key");
    String data = call.getString("data");
    getContext().getSharedPreferences("aurora_widgets", Context.MODE_PRIVATE)
      .edit().putString(key, data).apply();
    call.resolve();
  }
  @PluginMethod public void read(PluginCall call) {
    String key = call.getString("key");
    String data = getContext().getSharedPreferences("aurora_widgets", Context.MODE_PRIVATE)
      .getString(key, null);
    JSObject ret = new JSObject();
    ret.put("data", data);
    call.resolve(ret);
  }
}
```
TS tarafı: `import { registerPlugin } from '@capacitor/core'; const AuroraStorage = registerPlugin('AuroraStorage');` → `AuroraStorage.write({ key: 'widgetData', data: json })`.

## 8. Doğrulama

- `npm run lint` → 0 hata
- `npm run build` → temiz
- APK build: `npm run apk` (PC'de, Android SDK + JDK 17+ gerekli)

## 9. Kapsam dışı

- React-Query / Redux gibi state management (mevcut `useDB` yeterli)
- 9 sayfanın hepsine widget (sadece 3'ünü yap, diğerleri altyapı sonrası)
- Web Push bildirimi
- shadcn entegrasyonu (reset'le silindi)