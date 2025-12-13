@echo off
echo ========================================
echo Lumina - Production Mode
echo ========================================
echo.

REM Check if dist folder exists
if not exist "dist" (
    echo [UYARI] Build dosyalari bulunamadi!
    echo.
    echo Build olusturuluyor...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [HATA] Build basarisiz!
        pause
        exit /b 1
    )
)

echo.
echo Production modunda baslatiliyor...
echo.

npx cross-env NODE_ENV=production electron .

