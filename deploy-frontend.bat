@echo off
echo ========================================
echo   Praashibysupal Frontend Deployment
echo ========================================
echo.

echo Step 1: Building frontend with production settings...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo Build failed! Please check the errors above.
    pause
    exit /b 1
)

echo.
echo Step 2: Build completed successfully!
echo.
echo Step 3: Frontend build files are ready in: frontend/build/
echo.
echo Next steps:
echo 1. Upload the contents of frontend/build/ to your web server
echo 2. Make sure your web server is configured to serve index.html for all routes
echo 3. Ensure the _redirects file is properly configured for SPA routing
echo.
echo The admin panel should now work at: https://praashibysupal.com/admin/
echo.
pause

