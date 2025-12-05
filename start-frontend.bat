@echo off
echo Starting Frontend Server...
cd /d D:\praashi\frontend
echo Current directory: %CD%
echo Installing dependencies if needed...
npm install
echo Starting React app...
set PORT=3001
npm start
pause
