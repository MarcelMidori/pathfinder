# Pathfinder: Graph Theory Game

An educational web game where players learn graph theory by manually finding shortest paths between nodes and comparing their performance against visualized algorithms.

## Setup

This project uses ES6 modules, which require a web server to run (due to CORS restrictions). You cannot open `index.html` directly in a browser using the `file://` protocol.

### Running the Game

#### Development Mode (with Hot Reload - Recommended)

For instant updates when you change files:

1. **Using the dev server script:**
   ```bash
   ./dev-server.sh
   ```
   This will automatically reload the page when you save changes to any file.

2. **Using npm (if Node.js is installed):**
   ```bash
   npm install  # First time only
   npm run dev
   ```

3. **Manual live-server:**
   ```bash
   npx live-server --port=8000 --open=/index.html --watch=src,index.html,styles.css
   ```

#### Production Mode (Simple Server)

1. **Using Python:**
   ```bash
   python3 -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.

2. **Using the start script:**
   ```bash
   ./start-server.sh
   ```

**Note:** For hot reload during development, use the dev server. The simple Python server doesn't auto-reload.

## Project Structure

```
/pathfinder
  ├── index.html        # Main entry point
  ├── styles.css       # Dark theme styling
  └── src/
      ├── main.js      # Game loop & event handlers
      ├── graph.js     # Node & edge generation
      ├── renderer.js  # Canvas drawing
      └── algorithms.js # Dijkstra & pathfinding
```

## Features

- Random graph generation with proximity-based edges
- Interactive pathfinding by clicking nodes
- Dijkstra's algorithm visualization
- Distance calculation and comparison

## Troubleshooting

If nothing appears when you open the page:

1. **Check browser console** (F12) for errors
2. **Make sure you're using a web server** - ES6 modules won't work with `file://` protocol
3. **Check that all files are in the correct locations**
4. **Verify your browser supports ES6 modules** (all modern browsers do)

