@echo off
REM Meets Mobile - Docker Helper Script (Windows)
REM Facilita o uso do Docker e Docker Compose no Windows

setlocal enabledelayedexpansion

:menu
cls
echo.
echo ╔════════════════════════════════════════╗
echo ║  Meets Mobile - Docker Helper          ║
echo ╚════════════════════════════════════════╝
echo.
echo 1) Iniciar todos os servicos
echo 2) Parar todos os servicos
echo 3) Ver logs (todos)
echo 4) Ver logs (backend)
echo 5) Ver logs (frontend)
echo 6) Entrar no backend (shell)
echo 7) Entrar no frontend (shell)
echo 8) Reconstruir imagens
echo 9) Status dos containers
echo 10) Limpar tudo (volumes + containers)
echo 0) Sair
echo.

set /p choice="Escolha uma opcao: "

if "%choice%"=="1" (
    echo Iniciando servicos...
    docker-compose up --build
    goto menu
)
if "%choice%"=="2" (
    echo Parando servicos...
    docker-compose down
    echo Servicos parados
    pause
    goto menu
)
if "%choice%"=="3" (
    docker-compose logs -f
    goto menu
)
if "%choice%"=="4" (
    docker-compose logs -f backend
    goto menu
)
if "%choice%"=="5" (
    docker-compose logs -f frontend
    goto menu
)
if "%choice%"=="6" (
    echo Entrando no Backend (shell)...
    docker-compose exec backend sh
    goto menu
)
if "%choice%"=="7" (
    echo Entrando no Frontend (shell)...
    docker-compose exec frontend sh
    goto menu
)
if "%choice%"=="8" (
    echo Reconstruindo imagens...
    docker-compose up --build -d
    echo Imagens reconstruidas
    pause
    goto menu
)
if "%choice%"=="9" (
    echo Status dos containers:
    docker ps -a | findstr meets
    pause
    goto menu
)
if "%choice%"=="10" (
    echo Removendo tudo?
    set /p confirm="Tem certeza? (s/n): "
    if "!confirm!"=="s" (
        docker-compose down -v
        echo Tudo limpo
    )
    pause
    goto menu
)
if "%choice%"=="0" (
    exit /b 0
)

echo Opcao invalida
pause
goto menu
