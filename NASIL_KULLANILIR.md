# 🚀 Lumina - Nasıl Kullanılır?

## 📌 Hızlı Başlangıç

Lumina'yı çalıştırmanın **3 farklı yolu** var:

---

## 1️⃣ Production Modu (ÖNERİLEN - İnternet Gerektirmez)

Bu mod, uygulamayı **tam bir masaüstü uygulaması** gibi çalıştırır.

### Adımlar:

**A) İlk Kez Çalıştırma:**
```bash
# 1. Build alın (sadece bir kez)
npm run build

# 2. Uygulamayı başlatın
npx cross-env NODE_ENV=production electron .
```

**B) Hızlı Başlatma (Windows):**
```bash
start-production.bat
```
Bu dosyaya çift tıklayarak da çalıştırabilirsiniz.

### ✅ Avantajları:
- ✅ Çok hızlı açılır
- ✅ İnternet bağlantısı gerektirmez
- ✅ Gerçek masaüstü uygulaması gibi çalışır
- ✅ Optimize edilmiş performans

### ⚠️ Not:
- Kod değişikliği yaptığınızda `npm run build` komutunu tekrar çalıştırmalısınız

---

## 2️⃣ Geliştirme Modu (Kod Geliştirme İçin)

Bu mod, **kod yazarken** kullanılır. Değişiklikler anında yansır.

### Adımlar:

**A) Komut Satırı:**
```bash
npm run electron:dev
```

**B) Hızlı Başlatma (Windows):**
```bash
start-electron.bat
```

### ✅ Avantajları:
- ✅ Hot-reload (değişiklikler anında yansır)
- ✅ DevTools açık gelir (hata ayıklama için)
- ✅ Geliştirme için ideal

### ⚠️ Dikkat:
- İlk açılış biraz yavaş olabilir
- Vite dev server çalışmalı (otomatik başlar)

---

## 3️⃣ Web Tarayıcısında (Basit Test İçin)

Electron olmadan, sadece web tarayıcısında çalıştırma.

### Adımlar:
```bash
npm run dev
```

Tarayıcıda açın: http://localhost:5173

### ✅ Avantajları:
- ✅ En hızlı başlatma
- ✅ Tarayıcı DevTools kullanabilirsiniz

### ❌ Dezavantajları:
- ❌ Masaüstü özellikleri yok
- ❌ Pencere kontrolü yok

---

## 📦 Kurulum Dosyası Oluşturma

Uygulamayı başkalarına dağıtmak için:

### Windows için:
```bash
npm run electron:build:win
```

veya

```bash
build-electron.bat
```

### Sonuç:
`release/` klasöründe:
- ✅ **Lumina Setup.exe** - Kurulum programı
- ✅ **Lumina.exe** - Taşınabilir sürüm

---

## 🔧 Hangi Modu Kullanmalıyım?

| Durum | Önerilen Mod |
|-------|--------------|
| Normal kullanım | **Production** (`start-production.bat`) |
| Kod geliştirme | **Geliştirme** (`start-electron.bat`) |
| Hızlı test | **Web** (`npm run dev`) |
| Dağıtım | **Build** (`build-electron.bat`) |

---

## ❓ Sorun Giderme

### Boş Ekran Görünüyorsa:

**Production Modunda:**
```bash
# Build almayı unutmuş olabilirsiniz
npm run build
cross-env NODE_ENV=production electron .
```

**Geliştirme Modunda:**
```bash
# Vite server çalışmıyor olabilir
# Önce Vite'ı başlatın:
npm run dev

# Sonra başka bir terminal'de:
cross-env NODE_ENV=development electron .
```

### "Cannot find module" Hatası:
```bash
# Paketleri yeniden yükleyin
npm install
```

### Port 5173 Kullanımda:
```bash
# Portu temizleyin
npx kill-port 5173
```

---

## 📊 Performans Karşılaştırması

| Mod | Başlatma Süresi | RAM Kullanımı | İnternet |
|-----|----------------|---------------|----------|
| Production | ~2 saniye | ~150 MB | ❌ Hayır |
| Geliştirme | ~5 saniye | ~250 MB | ✅ Evet |
| Web | ~1 saniye | ~100 MB | ✅ Evet |

---

## 🎯 Önerilen Kullanım

### Günlük Kullanım:
1. `start-production.bat` dosyasına çift tıklayın
2. Lumina açılır
3. Notlarınızı alın
4. Kapatın

### Geliştirme:
1. `start-electron.bat` ile başlatın
2. Kod değiştirin
3. Değişiklikler otomatik yansır
4. Test edin

### Dağıtım:
1. `npm run build` ile build alın
2. `build-electron.bat` ile kurulum dosyası oluşturun
3. `release/` klasöründeki dosyaları paylaşın

---

## 💡 İpuçları

1. **İlk Kullanım:** `start-production.bat` kullanın (en kolay)
2. **Masaüstü Kısayolu:** `start-production.bat` dosyasının kısayolunu masaüstüne koyun
3. **Hızlı Erişim:** Windows'ta görev çubuğuna sabitleyin
4. **Otomatik Başlatma:** Başlangıç klasörüne kısayol ekleyin

---

**Artık Lumina'yı kullanmaya hazırsınız!** 🎉

