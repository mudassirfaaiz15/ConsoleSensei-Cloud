@echo off
REM Start the Flask backend server
cd /d "%~dp0"
echo Starting Flask API Server on http://127.0.0.1:5000
echo Press Ctrl+C to stop
python api.py
pause
