# MongoDB Start Script
Write-Host "Starting MongoDB..." -ForegroundColor Yellow

# Check if MongoDB is already running
$mongodProcess = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongodProcess) {
    Write-Host "MongoDB is already running!" -ForegroundColor Green
    exit 0
}

# Try to start MongoDB service
try {
    Start-Service MongoDB -ErrorAction Stop
    Write-Host "✅ MongoDB Service started successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Could not start MongoDB service. Trying manual start..." -ForegroundColor Red
    
    # Create data directory if it doesn't exist
    $dbPath = "C:\data\db"
    if (-not (Test-Path $dbPath)) {
        Write-Host "Creating data directory: $dbPath" -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $dbPath -Force | Out-Null
    }
    
    # Start MongoDB manually
    Write-Host "Starting MongoDB manually..." -ForegroundColor Yellow
    Write-Host "Note: Keep this window open while MongoDB is running." -ForegroundColor Cyan
    mongod --dbpath $dbPath --port 27017
}

