@echo off
echo Starting WorkZen HRMS Development Servers...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd Backend && npm run dev"

echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd Frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:8080 (or next available port)
echo.
echo Press any key to exit...
pause >nul