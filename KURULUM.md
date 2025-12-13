# 🚀 Lumina Masaüstü Uygulaması - Kurulum Rehberi

## ⚠️ ÖNEMLİ: İlk Adım

İnternet bağlantınız düzeldiğinde, **mutlaka** aşağıdaki komutu çalıştırın:

```bash
npm install --save-dev electron electron-builder concurrently wait-on cross-env
```

Bu komut olmadan masaüstü uygulaması çalışmaz!

---

## 📋 Hızlı Başlangıç

### 1️⃣ Geliştirme Modunda Çalıştırma

**Yöntem 1: Komut Satırı**
```bash
npm run electron:dev
```

**Yöntem 2: Batch Dosyası (Windows)**
```bash
start-electron.bat
```
Bu dosyaya çift tıklayarak da çalıştırabilirsiniz.

### 2️⃣ Masaüstü Uygulaması Oluşturma

**Yöntem 1: Komut Satırı**
```bash
npm run electron:build:win
```

**Yöntem 2: Batch Dosyası (Windows)**
```bash
build-electron.bat
```
Bu dosyaya çift tıklayarak da çalıştırabilirsiniz.

Build tamamlandıktan sonra `release/` klasöründe şunları bulacaksınız:
- **Lumina Setup.exe** - Kurulum programı (önerilen)
- **Lumina.exe** - Taşınabilir sürüm (kurulum gerektirmez)

---

## 📦 Paket Yükleme Detayları

Eğer paket yükleme sırasında hata alırsanız:

### Çözüm 1: Cache Temizleme
```bash
npm cache clean --force
npm install --save-dev electron electron-builder concurrently wait-on cross-env
```

### Çözüm 2: Farklı Registry Kullanma
```bash
npm config set registry https://registry.npmmirror.com
npm install --save-dev electron electron-builder concurrently wait-on cross-env
npm config set registry https://registry.npmjs.org
```

### Çözüm 3: Yarn Kullanma
```bash
yarn add -D electron electron-builder concurrently wait-on cross-env
```

---

## 🎯 Kullanılabilir Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Web tarayıcısında geliştirme modu |
| `npm run electron:dev` | Electron penceresinde geliştirme modu |
| `npm run electron:build:win` | Windows için build |
| `npm run electron:build:mac` | macOS için build |
| `npm run electron:build:linux` | Linux için build |
| `npm run build` | Web için production build |

---

## 🔧 Sistem Gereksinimleri

### Geliştirme İçin:
- **Node.js**: v16 veya üzeri
- **npm**: v7 veya üzeri
- **RAM**: En az 4GB (8GB önerilir)
- **Disk**: En az 2GB boş alan

### Çalıştırma İçin:
- **Windows**: 7/8/10/11 (64-bit)
- **RAM**: En az 2GB
- **Disk**: En az 200MB boş alan

---

## 📁 Proje Dosyaları

```
lumina/
├── electron/
│   ├── main.js              # Electron ana dosyası
│   └── preload.js           # Güvenlik katmanı
├── src/                     # React kaynak kodları
├── public/
│   └── logo.png            # Uygulama ikonu
├── release/                 # Build çıktıları (otomatik oluşur)
├── start-electron.bat       # Hızlı başlatma (Windows)
├── build-electron.bat       # Hızlı build (Windows)
├── ELECTRON_SETUP.md        # Detaylı teknik dokümantasyon
└── package.json            # Proje yapılandırması
```

---

## ✅ Başarılı Kurulum Kontrolü

Paketler başarıyla yüklendiyse:

```bash
npm run electron:dev
```

Bu komut çalıştığında:
1. ✅ Vite dev server başlar (http://localhost:5173)
2. ✅ Electron penceresi açılır
3. ✅ Lumina uygulaması görünür

---

## 🐛 Sorun Giderme

### "electron: command not found"
**Çözüm:** Paketleri yükleyin
```bash
npm install --save-dev electron electron-builder concurrently wait-on cross-env
```

### "Port 5173 already in use"
**Çözüm:** Portu değiştirin veya çalışan uygulamayı kapatın
```bash
npx kill-port 5173
npm run electron:dev
```

### Build çok uzun sürüyor
**Normal:** İlk build 5-10 dakika sürebilir (Electron binary indirme)

### Windows Defender uyarısı
**Normal:** İmzasız uygulama uyarısıdır. "Daha fazla bilgi" → "Yine de çalıştır"

---

## 🎉 Tamamlandı!

Artık Lumina masaüstü uygulamanız hazır!

### Sonraki Adımlar:
1. ✅ `npm install` ile paketleri yükleyin
2. ✅ `npm run electron:dev` ile test edin
3. ✅ `npm run electron:build:win` ile kurulum dosyası oluşturun
4. ✅ `release/` klasöründeki dosyaları paylaşın

---

**Destek:** Sorun yaşarsanız `ELECTRON_SETUP.md` dosyasına bakın.

