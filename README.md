# Pathfinder: Graph Theory Game

An educational web game where players learn graph theory by manually finding shortest paths between nodes and comparing their performance against visualized algorithms.

## Setup

This project uses ES6 modules, which require a web server to run (due to CORS restrictions). You cannot open `index.html` directly in a browser using the `file://` protocol.

### Running the Game

1. **Using Python (recommended):**
   ```bash
   python3 -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.

2. **Using Node.js (if installed):**
   ```bash
   npx http-server -p 8000
   ```
   Then open `http://localhost:8000` in your browser.

3. **Using any other web server:**
   - Serve the project directory from any web server
   - Open `index.html` through the server URL

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

