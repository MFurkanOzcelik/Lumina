@echo off
echo ========================================
echo Lumina Icon Setup Checker
echo ========================================
echo.

set "BUILD_DIR=%~dp0"
set "ICON_FOUND=0"
set "DOC_ICON_FOUND=0"

echo Checking for required icon files...
echo.

REM Check for main app icon
if exist "%BUILD_DIR%icon.png" (
    echo [OK] Main app icon found: icon.png
    set "ICON_FOUND=1"
) else (
    echo [MISSING] Main app icon: icon.png
    if exist "%BUILD_DIR%app-icon-source.png" (
        echo [INFO] Source file found: app-icon-source.png
        echo [ACTION] Please rename or process app-icon-source.png to icon.png
    ) else if exist "%BUILD_DIR%app-icon-source.jpg" (
        echo [INFO] Source file found: app-icon-source.jpg
        echo [ACTION] Please convert app-icon-source.jpg to icon.png
    ) else (
        echo [ACTION] Please save Image 1 (App Logo) as app-icon-source.png
    )
)

echo.

REM Check for document icon
if exist "%BUILD_DIR%document-icon.png" (
    echo [OK] Document icon found: document-icon.png
    set "DOC_ICON_FOUND=1"
) else (
    echo [MISSING] Document icon: document-icon.png
    if exist "%BUILD_DIR%doc-icon-source.png" (
        echo [INFO] Source file found: doc-icon-source.png
        echo [ACTION] Please rename or process doc-icon-source.png to document-icon.png
    ) else if exist "%BUILD_DIR%doc-icon-source.jpg" (
        echo [INFO] Source file found: doc-icon-source.jpg
        echo [ACTION] Please convert doc-icon-source.jpg to document-icon.png
    ) else (
        echo [ACTION] Please save Image 2 (Document Logo) as doc-icon-source.png
    )
)

echo.
echo ========================================

if "%ICON_FOUND%"=="1" if "%DOC_ICON_FOUND%"=="1" (
    echo [SUCCESS] All icons are ready!
    echo.
    echo You can now build the application:
    echo   npm run electron:build:win
    echo.
) else (
    echo [INCOMPLETE] Some icons are missing.
    echo.
    echo Next steps:
    echo 1. Save your attached images in the build/ directory
    echo 2. Run: python build/process_icons.py
    echo    OR manually rename/convert to icon.png and document-icon.png
    echo 3. Run this script again to verify
    echo.
    echo See build/QUICK_START.md for detailed instructions.
    echo.
)

echo ========================================
pause

