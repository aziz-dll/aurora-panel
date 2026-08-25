# 🎒 Aurora

Termux'ta lokal çalışan, Notion tarzı öğrenci paneli. Hesap yok, bulut yok, AI yok — **her şey cihazında** (localStorage).

## Özellikler

- 🏠 **Panel** — bugünkü dersler, bekleyen görevler, sınav geri sayımı, batarya durumu
- ✅ **Görevler** — öncelik/termin/filtre/arama, hızlı ekleme, satır içi düzenleme
- 📅 **Ders Programı** — günlere göre renkli ders kartları, "Şimdi" göstergesi
- 🎓 **Öğrenci** — dersler, sınav notları, ağırlıklı ortalama + GPA (4'lük), sınav takvimi
- 📝 **Notlar** — sabitleme, otomatik kayıt, kelime sayacı
- 🏋️ **Spor** — kişisel evde aletsiz antrenman programı, gün gün işaretleme, seri takibi
- ⚙️ **Ayarlar** — koyu/açık tema, 6 vurgu rengi, JSON yedek al/geri yükle

## Termux API entegrasyonu

Sunucu (`server.mjs`) `termux-api` komutlarını köprüler:

| Uç | Komut |
|---|---|
| `GET /api/battery` | `termux-battery-status` |
| `POST /api/notify` | `termux-notification` |
| `POST /api/toast` | `termux-toast` |
| `POST /api/vibrate` | `termux-vibrate` |
| `POST /api/clipboard` | `termux-clipboard-set` |

`termux-api` yoksa uygulama yine çalışır; sadece API uçları 503 döner.

## Kurulum (Termux — J7 Prime)

Hedef yol: `/data/data/com.termux/files/home/dashboard` (yani Termux'ta `~/dashboard`). Proje tamamen yol-bağımsızdır; `server.mjs` dist klasörünü kendi konumundan bulur.

### Yol A — Paketi PC'de hazırla, telefona at (önerilen)

Sunucu sıfır bağımlılıklı (sadece Node stdlib) — telefonda `npm install` bile gerekmez:

```bash
# PC'de:
npm run build
npm run pack                 # → okul-paneli-deploy.tar.gz
# dosyayı telefona gönder (USB, scp, paylaşım...)

# Termux'ta:
termux-setup-storage         # depolama izni (bir kez)
mkdir ~/dashboard && tar xzf /sdcard/Download/okul-paneli-deploy.tar.gz -C ~/dashboard
bash ~/dashboard/start.sh    # wake-lock alır + sunucuyu başlatır
```

### Yol B — Projeyi telefona kopyala, telefonda derle

```bash
pkg install nodejs-lts termux-api git   # + F-Droid'den "Termux:API" uygulaması
git clone <repo> ~/dashboard && cd ~/dashboard
npm install && npm run build
npm run start:termux
```

Geliştirme modu: `npm run dev` (Vite, `/api` isteklerini 8788'e proxy'ler).

Sunucu varsayılan olarak `0.0.0.0`'a bağlanır — açılışta ağdaki cihazlar için `http://<ip>:8788` adresini ekrana yazar.

## APK (Capacitor)

APK, J7 Prime'daki sunucuya bağlanan ince bir sarmalayıcıdır. İçinde panel yok — açılışta sunucu adresini bir kez sorar, hatırlar (IP değişirse yeniden yazılır, yeniden derlemek gerekmez).

```bash
npm run apk   # cap sync + gradle assembleDebug
```

Çıktı: `android/app/build/outputs/apk/debug/app-debug.apk` (kökte `Okul-Paneli.apk` kopyası).

Ön koşullar: JDK 21 (`~/jdk/jdk-21.0.12.1+1`) + Android SDK komut satırı araçları (`~/Android/Sdk`). Giriş ekranı `apk-loader/index.html` dosyasıdır.

## Betikler

| Komut | İş |
|---|---|
| `npm run dev` | Vite geliştirme sunucusu |
| `npm run build` | Tip kontrolü + üretim derlemesi (`dist/`) |
| `npm run start` | `dist/` + termux-api köprüsünü 8788 portunda sunar |
| `npm run start:termux` | `start.sh`: wake-lock + sunucu (Termux) |
| `npm run apk` | Capacitor sync + debug APK derleme |
| `npm run pack` | Telefona atılacak dağıtım paketi (`dist + server.mjs + start.sh`) |
| `npm run lint` | oxlint |
