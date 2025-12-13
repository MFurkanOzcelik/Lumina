# 🚀 Lumina - GitHub Release Rehberi

## 📦 Oluşturulan Dosyalar

Build işlemi başarıyla tamamlandı! `release/` klasöründe şu dosyalar oluşturuldu:

### 1. **Lumina Setup 1.0.0.exe** (94.87 MB) ⭐ ÖNERİLEN
- **Tam Kurulum Programı**
- Windows Installer (NSIS)
- Masaüstü kısayolu oluşturur
- Başlat menüsüne ekler
- Kaldırma programı içerir
- **Kullanıcılar için en kolay seçenek**

### 2. **Lumina 1.0.0.exe** (94.62 MB)
- **Portable (Taşınabilir) Sürüm**
- Kurulum gerektirmez
- USB belleğe kopyalanabilir
- Çift tıkla çalıştır
- Kayıt defteri değişikliği yapmaz

---

## 📤 GitHub'a Yükleme Adımları

### Adım 1: Repository Oluştur

1. GitHub'da yeni repository oluştur
2. Repository adı: `lumina` veya `lumina-notes`
3. Public veya Private seç
4. README ekle (opsiyonel)

### Adım 2: Release Oluştur

1. Repository'de **"Releases"** sekmesine git
2. **"Create a new release"** tıkla
3. **Tag version:** `v1.0.0` yaz
4. **Release title:** `Lumina v1.0.0 - İlk Sürüm`
5. **Description:** Aşağıdaki metni kullan

### Adım 3: Dosyaları Yükle

**"Attach binaries"** bölümüne şu dosyaları sürükle:

```
release/
├── Lumina Setup 1.0.0.exe    ⭐ (Kurulum programı)
└── Lumina 1.0.0.exe          (Portable sürüm)
```

---

## 📝 Önerilen Release Açıklaması

```markdown
# 🌟 Lumina v1.0.0

Modern, güçlü ve kullanıcı dostu not alma uygulaması.

## ✨ Özellikler

- 📝 **Zengin Metin Editörü**: Bold, italic, underline, listeler ve daha fazlası
- 📁 **Klasör Yönetimi**: Notlarınızı organize edin
- 📄 **PDF Desteği**: PDF dosyalarını görüntüleyin
- 🎨 **Tema Desteği**: Açık ve koyu tema
- 🌍 **Çoklu Dil**: Türkçe ve İngilizce
- 💾 **Yerel Depolama**: Verileriniz bilgisayarınızda güvende
- 🖱️ **Sürükle-Bırak**: Kolay organizasyon
- ⌨️ **Klavye Kısayolları**: Hızlı çalışma

## 📥 İndirme

### Windows

**Önerilen:** [Lumina Setup 1.0.0.exe](link) (94.87 MB)
- Tam kurulum programı
- Masaüstü kısayolu
- Başlat menüsü entegrasyonu

**Alternatif:** [Lumina 1.0.0.exe](link) (94.62 MB)
- Portable sürüm
- Kurulum gerektirmez
- USB belleğe kopyalanabilir

## 🚀 Kurulum

### Yöntem 1: Kurulum Programı (Önerilen)

1. `Lumina Setup 1.0.0.exe` dosyasını indirin
2. Çift tıklayarak çalıştırın
3. Kurulum sihirbazını takip edin
4. Masaüstünden veya Başlat menüsünden açın

### Yöntem 2: Portable

1. `Lumina 1.0.0.exe` dosyasını indirin
2. İstediğiniz klasöre kopyalayın
3. Çift tıklayarak çalıştırın

## 💡 İlk Kullanım

1. Uygulamayı açın
2. "Yeni Not" butonuna tıklayın
3. Notunuzu yazmaya başlayın
4. Otomatik olarak kaydedilir!

## 🔧 Sistem Gereksinimleri

- **İşletim Sistemi:** Windows 7/8/10/11 (64-bit)
- **RAM:** En az 2GB
- **Disk Alanı:** En az 200MB

## 📚 Dokümantasyon

Detaylı kullanım rehberi için [Wiki](link) sayfasını ziyaret edin.

## 🐛 Hata Bildirimi

Bir hata mı buldunuz? [Issue açın](link)

## 📄 Lisans

[MIT License](LICENSE)

---

**Lumina ile notlarınızı daha verimli yönetin!** ✨
```

---

## 🎯 Kullanıcılar İçin Hızlı Başlangıç

### İndirme Bağlantıları

GitHub Release sayfanızda kullanıcılar şu bağlantıları görecek:

```
Assets (2)
├── Lumina Setup 1.0.0.exe    94.87 MB
└── Lumina 1.0.0.exe          94.62 MB
```

### Önerilen İndirme

**Çoğu kullanıcı için:** `Lumina Setup 1.0.0.exe`
- Çift tıkla, kur, kullan
- En kolay yöntem

**İleri düzey kullanıcılar için:** `Lumina 1.0.0.exe`
- Kurulum yok
- Portable kullanım

---

## 📊 Dosya Bilgileri

| Dosya | Boyut | Tür | Önerilen |
|-------|-------|-----|----------|
| Lumina Setup 1.0.0.exe | 94.87 MB | Installer | ⭐ Evet |
| Lumina 1.0.0.exe | 94.62 MB | Portable | - |

---

## 🔐 Güvenlik Notu

### Windows Defender Uyarısı

İlk çalıştırmada Windows Defender uyarısı çıkabilir:

**Çözüm:**
1. "Daha fazla bilgi" tıklayın
2. "Yine de çalıştır" seçin

**Neden?** Uygulama dijital olarak imzalanmamış (ücretsiz sertifika gerekir)

### Dijital İmza Ekleme (Opsiyonel)

Profesyonel dağıtım için:
1. Code signing sertifikası alın
2. `package.json` içinde `certificateFile` ekleyin
3. Yeniden build alın

---

## 📦 Sonraki Sürümler İçin

### Versiyon Güncelleme

1. `package.json` içinde version'ı artır:
```json
"version": "1.0.1"
```

2. Build al:
```bash
npm run electron:build:win
```

3. Yeni release oluştur: `v1.0.1`

### Otomatik Güncelleme (Gelecek)

GitHub Releases ile otomatik güncelleme:
- `electron-updater` paketi
- `autoUpdater` konfigürasyonu
- Kullanıcılar otomatik bildirim alır

---

## ✅ Kontrol Listesi

Release öncesi kontrol edin:

- [ ] `package.json` version doğru
- [ ] Build başarılı (`npm run electron:build:win`)
- [ ] Her iki `.exe` dosyası oluştu
- [ ] Dosya boyutları makul (~95 MB)
- [ ] GitHub repository hazır
- [ ] Release açıklaması hazır
- [ ] Screenshot'lar hazır (opsiyonel)
- [ ] LICENSE dosyası var

---

## 🎉 Tamamlandı!

Artık Lumina'yı GitHub'da paylaşabilirsiniz!

**Dosya Konumu:** `C:\not-app\release\`

**GitHub'a Yüklenecek Dosyalar:**
1. `Lumina Setup 1.0.0.exe` (94.87 MB)
2. `Lumina 1.0.0.exe` (94.62 MB)

---

**İyi dağıtımlar!** 🚀

