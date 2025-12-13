@echo off
echo Clearing Vite cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Vite cache cleared!
) else (
    echo No Vite cache found.
)

echo.
echo Starting Vite dev server with force flag...
npm run dev -- --force --host

