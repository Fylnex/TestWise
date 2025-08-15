# Определение базовой директории как места, где находится скрипт
$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Активация виртуальной среды Python
$venvPath = Join-Path $baseDir "Backend\.venv\Scripts\Activate.ps1"
if (Test-Path $venvPath) {
    & $venvPath
} else {
    Write-Host "Виртуальная среда не найдена по пути: $venvPath" -ForegroundColor Red
    exit
}

# Запуск бэкенда (FastAPI через uvicorn)
$backendPath = Join-Path $baseDir "Backend"
Set-Location $backendPath
$backendProcess = Start-Process -NoNewWindow -PassThru -FilePath "python" -ArgumentList "-m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload"
Write-Host "Бэкенд запущен на http://localhost:8000" -ForegroundColor Green

# Пауза для инициализации бэкенда (5 секунд)
Start-Sleep -Seconds 5

# Запуск фронтенда (через npm run dev)
$frontendPath = Join-Path $baseDir "FrontEnd"
if (Test-Path $frontendPath) {
    Set-Location $frontendPath
    $frontendProcess = Start-Process -NoNewWindow -PassThru -FilePath "npm" -ArgumentList "run dev"
    Write-Host "Фронтенд запущен (ожидайте порт 5173)" -ForegroundColor Green
} else {
    Write-Host "Директория фронтенда не найдена: $frontendPath" -ForegroundColor Red
    exit
}

# Пауза для инициализации фронтенда (10 секунд, так как Vite может занять больше времени)
Start-Sleep -Seconds 10

# Открытие браузера (порт 5173 для Vite)
$browserUrl = "http://localhost:5173"
Start-Process $browserUrl
Write-Host "Браузер открыт на $browserUrl" -ForegroundColor Green

# Ожидание завершения (можно прервать с Ctrl+C)
Write-Host "Нажмите Ctrl+C для завершения работы скрипта..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")