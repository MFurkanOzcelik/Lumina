@echo off
echo ========================================
echo Lumina - Icon Test
echo ========================================
echo.

echo Kontrol ediliyor...
echo.

if exist "public\logo.ico" (
    echo [OK] public\logo.ico bulundu
) else (
    echo [HATA] public\logo.ico bulunamadi!
)

if exist "dist\logo.ico" (
    echo [OK] dist\logo.ico bulundu
) else (
    echo [UYARI] dist\logo.ico bulunamadi - npm run build calistirin
)

echo.
echo ========================================
echo Icon Dosya Bilgileri:
echo ========================================

if exist "public\logo.ico" (
    for %%A in ("public\logo.ico") do (
        echo Dosya: public\logo.ico
        echo Boyut: %%~zA bytes
        echo Tarih: %%~tA
    )
)

echo.
echo ========================================
echo Electron Yapılandırması:
echo ========================================
echo.
echo electron/main.js dosyasinda:
echo - Development: ../public/logo.ico
echo - Production:  ../dist/logo.ico
echo.
echo package.json dosyasinda:
echo - Build icon: public/logo.ico
echo.

pause

