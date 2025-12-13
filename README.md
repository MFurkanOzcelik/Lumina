#  Lumina

<div align="center">

![Lumina Logo](public/logo.png)

**Modern, güçlü ve kullanıcı dostu not alma uygulaması**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Windows](https://img.shields.io/badge/Platform-Windows-blue.svg)](https://www.microsoft.com/windows)
[![Version](https://img.shields.io/badge/Version-1.0.0-green.svg)](https://github.com/yourusername/lumina/releases)

[İndir](https://github.com/MFurkanOzcelik/Lumina/releases) • [Özellikler](#-özellikler) • [Kurulum](#-kurulum) • [Kullanım](#-kullanım)

</div>

---

##  Özellikler

###  Zengin Metin Editörü
- **Biçimlendirme**: Bold, Italic, Underline, Strikethrough
- **Listeler**: Madde işaretli ve numaralı listeler
- **Font Boyutu**: Özelleştirilebilir metin boyutu
- **Otomatik Kaydetme**: Değişiklikler anında kaydedilir

###  Güçlü Organizasyon
- **Klasör Yönetimi**: Notlarınızı klasörlerle organize edin
- **Sürükle-Bırak**: Kolay yeniden düzenleme
- **Arama**: Notlarınızı hızlıca bulun
- **Sağ Tık Menüsü**: Yeniden adlandır, sil, taşı

###  PDF Desteği
- **PDF Görüntüleme**: PDF dosyalarını doğrudan uygulamada açın
- **Tam Ekran**: Maksimize edilmiş okuma deneyimi
- **İndirme**: PDF'leri kolayca indirin

###  Modern Arayüz
- **Açık/Koyu Tema**: Gözlerinize uygun tema seçin
- **Kompakt Tasarım**: %75 ölçeklendirilmiş, verimli UI
- **Menüsüz**: Temiz, dikkat dağıtmayan arayüz
- **Responsive**: Her ekran boyutuna uyumlu

###  Çoklu Dil
- 🇹🇷 Türkçe
- 🇬🇧 English

###  Güvenli Depolama
- **Yerel Veri**: Tüm veriler bilgisayarınızda
- **IndexedDB**: Büyük dosyalar için optimize edilmiş
- **Gizlilik**: Verileriniz sadece sizde

---

##  İndirme

### Windows

| Dosya | Boyut | Açıklama |
|-------|-------|----------|
| [**Lumina Setup 1.0.0.exe**](https://github.com/MFurkanOzcelik/Lumina/releases/latest) | 94.87 MB | Kurulum programı (Önerilen) |
| [**Lumina 1.0.0.exe**](https://github.com/MFurkanOzcelik/Lumina/releases/latest) | 94.62 MB | Portable sürüm |

### Sistem Gereksinimleri

- **İşletim Sistemi**: Windows 7/8/10/11 (64-bit)
- **RAM**: En az 2GB
- **Disk Alanı**: En az 200MB

---

##  Kurulum

### Yöntem 1: Kurulum Programı (Önerilen)

1. `Lumina Setup 1.0.0.exe` dosyasını indirin
2. Çift tıklayarak çalıştırın
3. Kurulum sihirbazını takip edin
4. Masaüstünden veya Başlat menüsünden açın

### Yöntem 2: Portable

1. `Lumina 1.0.0.exe` dosyasını indirin
2. İstediğiniz klasöre kopyalayın
3. Çift tıklayarak çalıştırın

> **Not**: İlk çalıştırmada Windows Defender uyarısı çıkabilir. "Daha fazla bilgi" → "Yine de çalıştır" seçin.

---

##  Kullanım

### İlk Adımlar

1. **Yeni Not Oluştur**
   - Ana sayfada "Yeni Not" butonuna tıklayın
   - Başlık ve içerik ekleyin
   - Otomatik olarak kaydedilir

2. **Klasör Oluştur**
   - Sidebar'da "Yeni Klasör" butonuna tıklayın
   - Klasör adını girin
   - Notları sürükleyip klasöre bırakın

3. **PDF Ekle**
   - Bir not açın
   - "Belge Ekle" butonuna tıklayın
   - PDF dosyasını seçin

### Klavye Kısayolları

| Kısayol | Açıklama |
|---------|----------|
| `Tab` | 4 boşluk ekle |
| `Ctrl/Cmd + B` | Kalın yazı |
| `Ctrl/Cmd + I` | İtalik yazı |
| `Ctrl/Cmd + U` | Altı çizili yazı |

### Sağ Tık Menüsü

Not veya klasöre sağ tıklayarak:
- **Yeniden Adlandır**: İsim değiştir
- **Sil**: Kalıcı olarak sil
- **Taşı**: Başka klasöre taşı

---

##  Geliştirme

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Electron geliştirme modu
npm run electron:dev
```

### Build

```bash
# Web build
npm run build

# Windows installer oluştur
npm run electron:build:win

# macOS build
npm run electron:build:mac

# Linux build
npm run electron:build:linux
```

### Teknolojiler

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Animasyonlar**: Framer Motion
- **State Management**: Zustand
- **Depolama**: IndexedDB (idb-keyval)
- **Drag & Drop**: @dnd-kit
- **Desktop**: Electron
- **Build Tool**: Vite

---

##  Proje Yapısı

```
lumina/
├── src/
│   ├── components/       # React bileşenleri
│   ├── store/           # Zustand store'lar
│   ├── types/           # TypeScript tipleri
│   ├── utils/           # Yardımcı fonksiyonlar
│   └── App.tsx          # Ana uygulama
├── electron/
│   ├── main.js          # Electron ana process
│   └── preload.js       # Preload script
├── public/              # Statik dosyalar
└── release/             # Build çıktıları
```

---

##  Hata Bildirimi

Bir hata mı buldunuz? [Issue açın](https://github.com/MFurkanOzcelik/Lumina/issues)

---

##  Katkıda Bulunma

Katkılarınızı bekliyoruz!

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

---

##  Lisans

Bu proje [MIT License](LICENSE) altında lisanslanmıştır.

---

##  Teşekkürler

- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

<div align="center">

**Lumina ile notlarınızı daha verimli yönetin!** 

Made with ❤️ by Lumina Team

[⬆ Başa Dön](#-lumina)

</div>
