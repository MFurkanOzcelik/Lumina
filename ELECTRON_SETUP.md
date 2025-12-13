# Lumina - Masaüstü Uygulaması Kurulum Rehberi

## 📦 Gerekli Paketleri Yükleme

İnternet bağlantınız düzeldiğinde, aşağıdaki komutu çalıştırarak gerekli paketleri yükleyin:

```bash
npm install --save-dev electron electron-builder concurrently wait-on cross-env
```

## 🚀 Geliştirme Modu

Uygulamayı geliştirme modunda çalıştırmak için:

```bash
npm run electron:dev
```

Bu komut:
- Vite dev server'ı başlatır (http://localhost:5173)
- Electron penceresini açar
- Hot-reload özelliği ile çalışır

## 🏗️ Masaüstü Uygulaması Oluşturma

### Windows için:
```bash
npm run electron:build:win
```

Bu komut oluşturacak:
- `.exe` kurulum dosyası (NSIS installer)
- Taşınabilir `.exe` dosyası (portable)
- Dosyalar `release/` klasöründe olacak

### macOS için:
```bash
npm run electron:build:mac
```

Bu komut oluşturacak:
- `.dmg` dosyası
- `.zip` dosyası

### Linux için:
```bash
npm run electron:build:linux
```

Bu komut oluşturacak:
- `.AppImage` dosyası
- `.deb` paketi

### Tüm platformlar için:
```bash
npm run electron:build
```

## 📁 Proje Yapısı

```
lumina/
├── electron/
│   ├── main.js          # Ana Electron process
│   └── preload.js       # Preload script (güvenlik)
├── src/                 # React uygulaması
├── public/              # Statik dosyalar
├── dist/                # Build çıktısı
└── release/             # Masaüstü uygulaması çıktısı
```

## ⚙️ Yapılandırma

### package.json
- `main`: Electron giriş noktası
- `build`: Electron Builder yapılandırması
- Uygulama adı: **Lumina**
- App ID: `com.lumina.app`

### Özellikler
- ✅ Windows, macOS, Linux desteği
- ✅ Otomatik güncelleme hazır
- ✅ Modern güvenlik (contextIsolation)
- ✅ IndexedDB ile veri saklama
- ✅ PDF görüntüleme desteği
- ✅ Özel uygulama ikonu

## 🔧 Sorun Giderme

### Electron yüklenemiyor
İnternet bağlantınızı kontrol edin ve tekrar deneyin:
```bash
npm cache clean --force
npm install --save-dev electron
```

### Build hatası
Node.js versiyonunuzun güncel olduğundan emin olun:
```bash
node --version  # v16 veya üzeri olmalı
```

## 📝 Notlar

- İlk build işlemi uzun sürebilir (Electron binary indirme)
- Windows için build yaparken, Windows Defender uyarısı çıkabilir
- macOS için build yapmak için macOS gereklidir
- Linux için build yapmak için Linux veya WSL gereklidir

## 🎉 Başarılı Build Sonrası

Build tamamlandıktan sonra:
1. `release/` klasörüne gidin
2. Oluşturulan kurulum dosyasını çalıştırın
3. Lumina masaüstü uygulamanız hazır!

---

**Not:** Bu yapılandırma production-ready'dir. Uygulamanızı dağıtmadan önce:
- Dijital imza ekleyin (code signing)
- Otomatik güncelleme sunucusu kurun
- Lisans bilgilerini ekleyin

