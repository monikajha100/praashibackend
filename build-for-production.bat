@echo off
echo ========================================
echo Building for Production Deployment
echo ========================================

echo.
echo 1. Checking environment configuration...

REM Check if .env.production exists
if not exist "frontend\.env.production" (
    echo ERROR: frontend\.env.production file not found!
    echo Please create this file with REACT_APP_API_URL=https://api.praashibysupal.com/api
    pause
    exit /b 1
)

REM Check if _redirects file exists
if not exist "frontend\public\_redirects" (
    echo ERROR: frontend\public\_redirects file not found!
    echo This file is required for SPA routing in production.
    pause
    exit /b 1
)

echo ✅ Environment files found

echo.
echo 2. Building Frontend for Production...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)

echo.
echo 3. Frontend build completed successfully!
echo Build files are in: frontend/build/
echo.

echo 4. Backend is ready for production deployment
echo Backend files are in: backend/
echo.

echo ========================================
echo PRODUCTION DEPLOYMENT READY!
echo ========================================
echo.
echo Next steps:
echo 1. Upload frontend/build/ to your web server
echo 2. Upload backend/ to your server
echo 3. Install backend dependencies: npm install --production
echo 4. Configure environment variables on server
echo 5. Create admin user: node create-production-admin.js
echo 6. Start backend: node server.js
echo.
echo Admin Panel Access:
echo - URL: https://praashibysupal.com/admin
echo - Login: admin@praashibysupal.com
echo - Password: (run create-production-admin.js to get password)
echo.
echo Your Razorpay integration will work with live payments!
echo.
pause
