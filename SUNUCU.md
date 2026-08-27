# Sunucu (server.mjs) — Detaylı Bilgi

Aurora panelini telefonda (Termux içinde) çalıştıran küçük Node.js sunucusu. İki işi var: panelin derlenmiş halini (`dist/`) ağdaki cihazlara sunmak ve Termux:API üzerinden cihaz özelliklerini (batarya, bildirim, titreşim, pano) HTTP uçlarıyla açmak.

## Nasıl çalıştırılır

```bash
# 1. Paneli derle (dist/ üretir)
npm run build

# 2. Sunucuyu başlat
npm run start          # = node server.mjs
# veya Termux'ta:
bash start.sh          # build + start'ı tek seferde yapar
```

Başladığında konsola şu formatta adresler yazar:

```
  🎒 Aurora
  ─ Ağdaki cihazlar: 
    http://192.168.1.200:8788
  ─ Bu cihaz:        http://localhost:8788
```

Aynı WiFi'daki telefon/tarayıcı/APK bu adreslerden panele bağlanır.

## Ortam değişkenleri

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `PORT` | `8788` | Dinlenen port |
| `HOST` | `0.0.0.0` | Dinlenen arayüz (tüm ağ) |

## HTTP uçları

### Genel

| Uç | Yöntem | Açıklama |
| --- | --- | --- |
| `/` ve `/*` | GET | `dist/` altındaki statik dosyalar. Bilinmeyen yollar `index.html`'e düşer (SPA fallback). HTML `no-cache`, diğerleri 1 yıl immutable cache. |
| `OPTIONS *` | — | CORS preflight; tüm API cevapları `Access-Control-Allow-Origin: *` döner. |

### API

Tümü `/api/` altında, JSON döner. Termux:API yoksa `/api/ping` hariç tüm uçlar `503 { ok: false }` verir.

| Uç | Yöntem | Gövde | Cevap | Arkada çalışan komut |
| --- | --- | --- | --- | --- |
| `/api/ping` | GET/POST | — | `{ ok: true, termux: boolean }` | `which termux-battery-status` (ilk seferde; sonuç önbelleğe alınır) |
| `/api/battery` | GET/POST | — | `{ percent: number\|null, charging: boolean, status: string }` | `termux-battery-status` |
| `/api/notify` | POST | `{ title, content }` | `{ ok: boolean }` | `termux-notification --title … --content …` |
| `/api/toast` | POST | `{ message }` | `{ ok: boolean }` | `termux-toast -g top …` |
| `/api/vibrate` | POST | `{ ms }` (en çok 5000) | `{ ok: boolean }` | `termux-vibrate -d …` |
| `/api/clipboard` | POST | `{ text }` (en çok 10 000 karakter) | `{ ok: boolean }` | `termux-clipboard-set …` |

Her komut 8 saniyelik zaman aşımıyla `execFile` üzerinden çalışır; hata/zaman aşımında ilgili uç `ok: false` döner.

## Panel ile ilişkisi

- Panel tarafındaki `src/lib/termux.ts` bu uçlara istek atar (batarya, bildirim testi, titreşim, pano).
- `src/lib/useTermuxStatus.ts` periyodik olarak `/api/ping` + `/api/battery` sorgular → sidebar'daki durum rozeti.
- `src/lib/serverBattery.ts` sunucu bataryası %25 altına düşerse client'ta uyarı çıkarır.
- Bildirimlerin kendisi (ödev/yazılı/su/spor hatırlatmaları) **sunucudan gönderilmez** — APK kabuğu (`apk-loader/index.html`) Capacitor LocalNotifications ile cihazda yerel kurar. Sunucu sadece batarya ve manuel Termux test uçlarını sağlar.

## Güvenlik notları

- Sunucu kimlik doğrulamasız çalışır; sadece güvendiğin ev WiFi ağında kullan. Dış ağa açma.
- Statik dosya sunumu `dist/` dışına çıkamaz (path traversal koruması var).
- İstek gövdesi 1 MB ile sınırlı; pano metni 10 000 karakterde kesilir.

## APK paketleme

```bash
npm run apk    # scripts/build-apk.sh — Capacitor ile Android APK üretir
npm run pack   # dist + server.mjs + start.sh'ı deploy arşivine toplar
```
