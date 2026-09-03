# Start CallFlow with Local SFU & Cloudflare HTTPS Tunnel
Write-Host "🚀 Starting CallFlow Video Calling App..." -ForegroundColor Cyan

# 1. Stop any existing processes on 5000, 5173, or 7880
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort 7880 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

# 2. Check if running local LiveKit SFU
$envContent = Get-Content "$PSScriptRoot\backend\.env" -Raw
if ($envContent -match "localhost:7880") {
    Write-Host "🎥 Starting Local LiveKit SFU server on port 7880..." -ForegroundColor Magenta
    Start-Process -FilePath "$PSScriptRoot\livekit\livekit-server.exe" -ArgumentList "--dev" -PassThru -NoNewWindow
    Start-Sleep -Seconds 1
}

# 3. Start Backend API
Write-Host "📡 Starting Backend API on port 5000..." -ForegroundColor Green
$backendJob = Start-Process -FilePath "node" -ArgumentList "src/server.js" -WorkingDirectory "$PSScriptRoot\backend" -PassThru -NoNewWindow

# 4. Start Frontend Vite Dev Server
Write-Host "💻 Starting Frontend on port 5173..." -ForegroundColor Green
$frontendJob = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "$PSScriptRoot\frontend" -PassThru -NoNewWindow

Start-Sleep -Seconds 3

# 5. Start Cloudflare Tunnel
Write-Host "🌐 Launching Cloudflare HTTPS Tunnel..." -ForegroundColor Yellow
Write-Host "Your public shareable link will appear below:`n" -ForegroundColor White

& "$PSScriptRoot\cloudflared.exe" tunnel --edge-ip-version 4 --url http://localhost:5173
