#!/bin/bash
# Development server with hot reload for Pathfinder game

echo "Starting development server with hot reload..."
echo "Open http://localhost:8000 in your browser"
echo "Files will auto-reload on changes"
echo "Press Ctrl+C to stop the server"
echo ""

# Check for live-server (Node.js tool with hot reload)
if command -v npx &> /dev/null; then
    echo "Using live-server (hot reload enabled)..."
    npx --yes live-server --port=8000 --open=/index.html --watch=src,index.html,styles.css
elif command -v python3 &> /dev/null; then
    echo "Using Python server (no hot reload - install Node.js for hot reload)"
    echo "For hot reload, run: npm install -g live-server"
    echo "Then: live-server --port=8000"
    python3 -m http.server 8000
else
    echo "Error: Neither Node.js nor Python found."
    echo "Install Node.js for hot reload: https://nodejs.org/"
    exit 1
fi

