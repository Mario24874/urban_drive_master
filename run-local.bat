@echo off
echo 🚀 Urban Drive - Servidor de desarrollo local
echo.
echo Iniciando servidor en http://localhost:3000
echo Presiona Ctrl+C para detener
echo.

cd /d "%~dp0"

REM Intentar con Python 3
python -m http.server 3000 2>nul
if errorlevel 1 (
    REM Intentar con Python 2 si Python 3 falla
    python -m SimpleHTTPServer 3000 2>nul
    if errorlevel 1 (
        echo ❌ Python no está instalado o no está en el PATH
        echo.
        echo Para ver el proyecto:
        echo 1. Abre start-dev.html directamente en tu navegador
        echo 2. O instala Python desde https://python.org
        pause
    )
)