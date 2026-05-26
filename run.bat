@echo off
TITLE GRIEVANCE PORTAL CONTROL CORE
COLOR 0B
CLS

:: Cyberpunk header display
echo ========================================================
echo   GRIEVANCE PORTAL - FUTURISTIC DARK SAAS CORE ENGINE
echo ========================================================
echo.
echo  [Diagnostic Node Check]
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ❌ ERROR: Node.js is not found in your system's PATH.
    echo Please install Node.js from https://nodejs.org before running this portal.
    echo.
    pause
    exit
)
echo  ✅ Node.js detected.
echo.
echo ========================================================
echo   SELECT RUN MODE:
echo ========================================================
echo   1. Start NEXT.JS FRONTEND ONLY (Operates via Browser Sandbox)
echo   2. Start EXPRESS.JS BACKEND SERVER ONLY (Requires local MySQL)
echo   3. Start BOTH CONCURRENTLY (Frontend on :3000, Backend on :5000)
echo   4. Exit Engine
echo ========================================================
echo.

set /p choice="Enter execution code (1-4): "

if "%choice%"=="1" goto frontend
if "%choice%"=="2" goto backend
if "%choice%"=="3" goto fullstack
if "%choice%"=="4" goto exit

:frontend
echo.
echo ========================================================
echo   LAUNCHING FRONTEND CONTROL CENTRE...
echo ========================================================
if not exist "node_modules\" (
    echo ℹ️ node_modules not found. Installing package dependencies. Please wait...
    call npm install
)
echo 🚀 Booting dev server...
start http://localhost:3000
call npm run dev
goto exit

:backend
echo.
echo ========================================================
echo   LAUNCHING EXPRESS BACKEND SERVER...
echo ========================================================
cd backend
echo ℹ️ Verifying backend dependencies...
call npm install
echo 🚀 Booting Express REST endpoints...
call npm run dev
cd ..
goto exit

:fullstack
echo.
echo ========================================================
echo   CONCURRENT FULL-STACK CO-LOCATION...
echo ========================================================
if not exist "node_modules\" (
    echo ℹ️ Frontend node_modules not found. Installing. Please wait...
    call npm install
)
cd backend
echo ℹ️ Verifying and installing backend dependencies (including newly added JWT and Bcrypt libraries)...
call npm install
cd ..

echo 🚀 Launching Express Backend Server in sub-window...
start cmd /k "title Grievance Backend Server && cd backend && npm run dev"

echo 🚀 Launching Next.js Frontend Dashboard...
start http://localhost:3000
call npm run dev
goto exit

:exit
echo.
echo ========================================================
echo   Engine closed. Terminal offline.
echo ========================================================
pause
exit
