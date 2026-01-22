@echo off
echo Starting local web server...
echo.
echo Open your browser and go to: http://localhost:8000/channel-binding-config.html
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8000
