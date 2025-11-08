# PowerShell script to start both frontend and backend
Write-Host "🚀 Starting WorkZen HRMS Development Servers..." -ForegroundColor Green

# Start backend first
Write-Host "📡 Starting Backend Server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd Backend; npm run dev" -WindowStyle Normal

# Wait a moment
Start-Sleep -Seconds 3

# Start frontend
Write-Host "🌐 Starting Frontend Server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd Frontend; npm run dev" -WindowStyle Normal

Write-Host "✅ Both servers are starting..." -ForegroundColor Green
Write-Host "📡 Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:8081 (or next available port)" -ForegroundColor Cyan
Write-Host "⏳ Please wait for both servers to fully start..." -ForegroundColor Yellow