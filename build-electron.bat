@echo off
echo ========================================
echo Lumina - Masaustu Uygulamasi Build
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\electron" (
    echo [HATA] Electron yuklenmemis!
    echo.
    echo Lutfen once su komutu calistirin:
    echo npm install --save-dev electron electron-builder concurrently wait-on cross-env
    echo.
    pause
    exit /b 1
)

echo Windows icin masaustu uygulamasi olusturuluyor...
echo.
echo Bu islem birkaç dakika surebilir...
echo.

npm run electron:build:win

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo BUILD BASARILI!
    echo ========================================
    echo.
    echo Kurulum dosyalari 'release' klasorunde olusturuldu:
    echo - Lumina Setup.exe ^(Installer^)
    echo - Lumina.exe ^(Portable^)
    echo.
    echo Bu dosyalari kullanarak uygulamayi yukleyebilirsiniz.
    echo.
) else (
    echo.
    echo [HATA] Build basarisiz oldu!
    echo.
)

pause

