#!/bin/bash
echo "Starting local web server..."
echo ""
echo "Open your browser and go to: http://localhost:8000/channel-binding-config.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
python3 -m http.server 8000
