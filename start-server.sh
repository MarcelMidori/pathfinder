#!/bin/bash
# Simple server launcher for Pathfinder game

echo "Starting web server for Pathfinder game..."
echo "Open http://localhost:8000 in your browser"
echo "Press Ctrl+C to stop the server"
echo ""

# Try Python 3 first
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
# Fall back to Python 2
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 8000
else
    echo "Error: Python not found. Please install Python or use another web server."
    echo "Alternatively, you can use:"
    echo "  - Node.js: npx http-server -p 8000"
    echo "  - PHP: php -S localhost:8000"
    exit 1
fi

