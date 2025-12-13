# 🔷 PowerShell'de Lumina Kullanımı

## ⚠️ Önemli Not

PowerShell'de batch dosyalarını çalıştırırken **mutlaka** `.\` ön eki kullanmalısınız!

---

## ✅ Doğru Kullanım

### Production Modu:
```powershell
.\start-production.bat
```

### Geliştirme Modu:
```powershell
.\start-electron.bat
```

### Build:
```powershell
.\build-electron.bat
```

---

## ❌ Yanlış Kullanım

```powershell
# Bu ÇALIŞMAZ:
start-production.bat

# PowerShell hatası verir:
# "The term 'start-production.bat' is not recognized..."
```

---

## 🎯 Alternatif Yöntemler

### 1. NPM Komutları (Önerilen)

PowerShell'de npm komutlarını doğrudan kullanabilirsiniz:

```powershell
# Production modu
npm run build
npx cross-env NODE_ENV=production electron .

# Geliştirme modu
npm run electron:dev

# Build
npm run electron:build:win
```

### 2. CMD'ye Geçiş

```powershell
# CMD'yi aç
cmd

# Sonra normal şekilde çalıştır
start-production.bat
```

### 3. Çift Tıklama

Windows Gezgini'nden dosyaya çift tıklayın:
- `start-production.bat`
- `start-electron.bat`
- `build-electron.bat`

---

## 📋 Hızlı Referans

| İşlem | PowerShell Komutu |
|-------|-------------------|
| Production başlat | `.\start-production.bat` |
| Geliştirme başlat | `.\start-electron.bat` |
| Build al | `.\build-electron.bat` |
| Sadece build | `npm run build` |
| Electron başlat | `npx cross-env NODE_ENV=production electron .` |

---

## 💡 İpucu: Alias Oluşturma

PowerShell profilinize alias ekleyerek daha kolay kullanabilirsiniz:

```powershell
# PowerShell profilini aç
notepad $PROFILE

# Şunu ekleyin:
function Start-Lumina { .\start-production.bat }
function Start-LuminaDev { .\start-electron.bat }

# Kaydet ve yeniden yükle
. $PROFILE

# Artık şöyle kullanabilirsiniz:
Start-Lumina
Start-LuminaDev
```

---

## 🔧 Sorun Giderme

### "Execution Policy" Hatası

Eğer script çalıştırma hatası alırsanız:

```powershell
# Mevcut policy'yi kontrol et
Get-ExecutionPolicy

# Geçici olarak izin ver (önerilen)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Sonra komutu çalıştır
.\start-production.bat
```

### "Access Denied" Hatası

```powershell
# Yönetici olarak PowerShell açın
# Veya CMD kullanın
```

---

## ✅ Şu Anda Yapmanız Gerekenler

Lumina'yı başlatmak için:

```powershell
.\start-production.bat
```

veya

```powershell
npm run build
npx cross-env NODE_ENV=production electron .
```

**Artık Lumina çalışıyor olmalı!** 🎉

