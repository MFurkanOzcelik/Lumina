# 🚀 Lumina - Masaüstü Kısayolu Oluşturma

## 📌 Hızlı Başlatma Dosyaları

Proje klasöründe 3 farklı başlatma dosyası var:

### 1. **Lumina.vbs** (ÖNERİLEN) ⭐
- **Avantajları:**
  - ✅ Arka planda çalışır
  - ✅ Konsol penceresi açmaz
  - ✅ Temiz başlatma
  - ✅ Windows ile tam uyumlu

### 2. **start-production.bat**
- **Avantajları:**
  - ✅ Konsol çıktısı gösterir
  - ✅ Hata ayıklama için iyi
  - ✅ İlerlemeyi görebilirsiniz

### 3. **Lumina.bat**
- **Avantajları:**
  - ✅ Minimize konsol
  - ✅ Hızlı başlatma

---

## 🖥️ Masaüstü Kısayolu Oluşturma

### Yöntem 1: VBScript ile (ÖNERİLEN)

1. **Lumina.vbs** dosyasına sağ tıklayın
2. **"Kısayol oluştur"** seçin
3. Kısayolu masaüstüne taşıyın
4. Kısayola sağ tıklayın → **"Özellikler"**
5. **"Simge değiştir"** → `public\logo.ico` dosyasını seçin
6. **Tamam**

### Yöntem 2: Batch Dosyası ile

1. **start-production.bat** dosyasına sağ tıklayın
2. **"Kısayol oluştur"** seçin
3. Kısayolu masaüstüne taşıyın
4. Kısayola sağ tıklayın → **"Özellikler"**
5. **"Simge değiştir"** → `public\logo.ico` dosyasını seçin
6. **Tamam**

---

## 📁 Dosya Konumları

```
C:\not-app\
├── Lumina.vbs              ⭐ (Önerilen - Arka plan)
├── Lumina.bat              (Minimize konsol)
├── start-production.bat    (Konsol gösterir)
└── public\
    └── logo.ico           (İkon dosyası)
```

---

## 🎯 Hangi Dosyayı Kullanmalıyım?

| Durum | Önerilen Dosya |
|-------|----------------|
| Normal kullanım | **Lumina.vbs** |
| Hata ayıklama | **start-production.bat** |
| Hızlı test | **Lumina.bat** |

---

## 💡 İpuçları

### 1. Görev Çubuğuna Sabitleme
- Kısayolu oluşturduktan sonra
- Görev çubuğuna sürükleyin
- Artık tek tıkla açılır

### 2. Başlangıçta Otomatik Açılma
- `Win + R` tuşlarına basın
- `shell:startup` yazın
- Kısayolu bu klasöre kopyalayın
- Windows başladığında Lumina otomatik açılır

### 3. Klavye Kısayolu Atama
- Kısayola sağ tık → Özellikler
- "Kısayol tuşu" alanına tıklayın
- Örnek: `Ctrl + Alt + L`
- Artık bu tuşlarla açılır

---

## 🔧 Sorun Giderme

### "Dosya bulunamadı" hatası
```bash
# Proje klasöründe olduğunuzdan emin olun
cd C:\not-app
```

### Konsol penceresi açılıyor (VBScript)
- **Lumina.vbs** kullanın, konsol açmaz
- Batch dosyaları konsol açar

### İkon görünmüyor
- Kısayol özelliklerinden manuel olarak ayarlayın
- `public\logo.ico` dosyasını seçin

---

## ✅ Önerilen Kurulum

1. **Lumina.vbs** dosyasından kısayol oluşturun
2. İkonu `public\logo.ico` olarak ayarlayın
3. Masaüstüne koyun
4. Görev çubuğuna sabitleyin
5. Artık tek tıkla Lumina açılır! 🎉

---

## 📝 Not

- İlk açılış 2-3 saniye sürebilir (build kontrolü)
- Sonraki açılışlar daha hızlı olur
- Konsol görmek istemiyorsanız **Lumina.vbs** kullanın

---

**Artık Lumina'yı masaüstünden kolayca açabilirsiniz!** 🚀

