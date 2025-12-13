@echo off
echo ========================================
echo Lumina - Gelistirme Modu
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\electron" (
    echo [HATA] Electron yuklenmemis!
    echo.
    echo Lutfen once su komutu calistirin:
    echo npm install
    echo.
    pause
    exit /b 1
)

echo Electron gelistirme modu baslatiliyor...
echo.
echo [1/2] Vite dev server baslatiliyor... (http://localhost:5173)
echo [2/2] Electron penceresi aciliyor...
echo.
echo NOT: Bu mod icin internet baglantisi gerekir (npm paketleri icin)
echo.
echo Uygulamayi kapatmak icin bu pencereyi kapatabilirsiniz.
echo.

npm run electron:dev

