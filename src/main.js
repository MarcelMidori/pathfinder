/**
 * main.js
 * Main game loop, initialization, and event handling
 */

import { generateGraph, DEFAULT_NODE_COUNT, DEFAULT_CONNECTIVITY_RADIUS } from './graph.js';
import { Renderer } from './renderer.js';
import { dijkstraAnimated, calculatePathWeight } from './algorithms.js';

// Game state
let graphData = null;
let userPath = [];
let isAnimating = false;
let renderer = null;

// Animation state
let animationHighlight = null;
let animationVisited = [];

// DOM elements
let canvas = null;
let algoBtn = null;
let targetDistEl = null;
let currentDistEl = null;
let statusMsgEl = null;

/**
 * Initialize the game
 */
export function init() {
    try {
        // Get DOM elements
        canvas = document.getElementById('gameCanvas');
        algoBtn = document.getElementById('algoBtn');
        targetDistEl = document.getElementById('targetDist');
        currentDistEl = document.getElementById('currentDist');
        statusMsgEl = document.getElementById('statusMsg');

        if (!canvas) {
            throw new Error('Canvas element not found');
        }

        // Initialize renderer
        renderer = new Renderer(canvas);

        // Set up event listeners
        setupEventListeners();

        // Generate initial graph
        generateNewGraph();
    } catch (error) {
        console.error('Error in init():', error);
        if (statusMsgEl) {
            statusMsgEl.innerText = 'Error: ' + error.message;
            statusMsgEl.style.color = '#F44336';
        }
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Canvas click handler
    canvas.addEventListener('mousedown', handleCanvasClick);

    // Make functions available globally for onclick handlers
    window.generateGraph = generateNewGraph;
    window.resetProgress = resetUserPath;
    window.runDijkstraAnimation = runDijkstraVisualization;
}

/**
 * Handle canvas click events
 */
function handleCanvasClick(e) {
    if (isAnimating || !graphData) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check if a node was clicked
    const clickedNode = renderer.getNodeAt(mx, my, graphData.nodes);
    if (clickedNode) {
        handleNodeClick(clickedNode.id);
    }
}

/**
 * Handle node click
 */
function handleNodeClick(nodeId) {
    if (!graphData || userPath.length === 0) return;

    const lastNodeId = userPath[userPath.length - 1];

    // If clicked the last node, undo (unless it's start)
    if (nodeId === lastNodeId && userPath.length > 1) {
        userPath.pop();
        updateUI();
        render();
        return;
    }

    // Check if neighbor
    const lastNode = graphData.nodes[lastNodeId];
    const isNeighbor = lastNode.neighbors.some(n => n.id === nodeId);

    if (isNeighbor && !userPath.includes(nodeId)) {
        userPath.push(nodeId);
        updateUI();
        render();

        // Check if path is complete
        if (nodeId === graphData.endNode) {
            statusMsgEl.innerText = "Path Complete! Check your score.";
            statusMsgEl.style.color = "#4CAF50";
        }
    }
}

/**
 * Generate a new graph
 */
function generateNewGraph() {
    graphData = generateGraph({
        nodeCount: DEFAULT_NODE_COUNT,
        connectivityRadius: DEFAULT_CONNECTIVITY_RADIUS,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
    });

    userPath = [graphData.startNode];
    isAnimating = false;
    
    if (algoBtn) {
        algoBtn.disabled = false;
    }

    updateUI();
    render();
}

/**
 * Reset user path to start
 */
function resetUserPath() {
    if (isAnimating || !graphData) return;
    userPath = [graphData.startNode];
    updateUI();
    render();
}

/**
 * Run Dijkstra algorithm visualization
 */
async function runDijkstraVisualization() {
    if (isAnimating || !graphData) return;

    isAnimating = true;
    if (algoBtn) {
        algoBtn.disabled = true;
    }

    statusMsgEl.innerText = "Running Dijkstra's algorithm...";
    statusMsgEl.style.color = "#aaa";

    // Reset animation state
    animationHighlight = null;
    animationVisited = [];

    // Step callback for visualization
    const onStep = (currentNode, visited, distances) => {
        animationHighlight = currentNode;
        animationVisited = visited;
        render();
    };

    // Completion callback
    const onComplete = (result) => {
        isAnimating = false;
        if (algoBtn) {
            algoBtn.disabled = false;
        }

        if (result.path.length > 0 && result.distance !== null) {
            targetDistEl.textContent = result.distance;
            statusMsgEl.innerText = `Optimal path found! Distance: ${result.distance}`;
            statusMsgEl.style.color = "#4CAF50";
            
            // Show the optimal path
            render(result.path);
        } else {
            statusMsgEl.innerText = "No path found between start and end nodes.";
            statusMsgEl.style.color = "#F44336";
        }
    };

    // Run animated algorithm
    await dijkstraAnimated(
        graphData.nodes,
        graphData.startNode,
        graphData.endNode,
        onStep,
        onComplete,
        300
    );

    // Final render without highlight
    animationHighlight = null;
    animationVisited = [];
    render();
}

/**
 * Update UI elements
 */
function updateUI() {
    if (!graphData) return;

    // Calculate user path distance
    const userDistance = calculatePathWeight(userPath, graphData.nodes);
    currentDistEl.textContent = userDistance;

    // Reset status message if path is incomplete
    if (userPath[userPath.length - 1] !== graphData.endNode) {
        statusMsgEl.innerText = "Select neighbors to move.";
        statusMsgEl.style.color = "#aaa";
    }
}

/**
 * Render the graph
 * @param {Array} optimalPath - Optional optimal path to highlight
 */
function render(optimalPath = null) {
    if (!graphData || !renderer) return;

    // Determine which nodes to highlight
    let highlightNodes = [];
    let visitedNodes = [];

    // If we're animating, use current animation state
    if (isAnimating) {
        if (animationHighlight !== null) {
            highlightNodes = [animationHighlight];
        }
        visitedNodes = animationVisited;
    } else if (optimalPath && optimalPath.length > 0) {
        // Otherwise, if optimal path is provided, highlight it
        highlightNodes = optimalPath;
    }

    renderer.draw(
        graphData,
        userPath,
        highlightNodes,
        visitedNodes
    );
}

// Initialize when DOM is ready
try {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
} catch (error) {
    console.error('Error initializing game:', error);
    alert('Error loading game. Please check the browser console for details.\n\nMake sure you are running this from a web server (not file://).\nYou can use: python3 -m http.server 8000');
}

