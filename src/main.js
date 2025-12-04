/**
 * main.js
 * Main game loop, initialization, and event handling
 */

import { generateGraph, DEFAULT_NODE_COUNT, DEFAULT_CONNECTIVITY_RADIUS } from './graph.js';
import { Renderer } from './renderer.js';
import { dijkstraAnimated, calculatePathWeight } from './algorithms.js';

// Game state
let graphData = null;
let raceGraphData = null; // Duplicate graph for race mode
let userPath = [];
let optimalPath = []; // Store optimal path from Dijkstra
let optimalDistance = null; // Store optimal distance
let isAnimating = false;
let renderer = null;
let raceRenderer = null; // Renderer for race mode canvas

// Race mode state
let raceMode = false;
let raceStarted = false; // Whether race has been started
let raceStartTime = null;
let raceAlgoComplete = false;
let raceAlgoDistance = null;
let raceAlgoTime = null;
let raceDifficulty = 'medium'; // 'easy', 'medium', 'hard'
let raceAnimationHighlight = null;
let raceAnimationVisited = [];

// Animation state
let animationHighlight = null;
let animationVisited = [];

// DOM elements
let canvas = null;
let raceCanvas = null;
let algoBtn = null;
let raceBtn = null;
let targetDistEl = null;
let currentDistEl = null;
let statusMsgEl = null;
let raceStatsEl = null;
let raceUserDistEl = null;
let raceUserTimeEl = null;
let raceAlgoDistEl = null;
let raceAlgoTimeEl = null;
let raceCanvasSection = null;
let canvasContainer = null;
let startRaceBtn = null;

// Race difficulty speeds (delay in milliseconds)
const RACE_SPEEDS = {
    easy: 1000,  // Very slow - much easier to beat
    medium: 300, // Medium speed
    hard: 150    // Fast - harder to beat
};

/**
 * Initialize the game
 */
export function init() {
    try {
        // Get DOM elements
        canvas = document.getElementById('gameCanvas');
        raceCanvas = document.getElementById('raceCanvas');
        algoBtn = document.getElementById('algoBtn');
        raceBtn = document.getElementById('raceBtn');
        targetDistEl = document.getElementById('targetDist');
        currentDistEl = document.getElementById('currentDist');
        statusMsgEl = document.getElementById('statusMsg');
        raceStatsEl = document.getElementById('raceStats');
        raceUserDistEl = document.getElementById('raceUserDist');
        raceUserTimeEl = document.getElementById('raceUserTime');
        raceAlgoDistEl = document.getElementById('raceAlgoDist');
        raceAlgoTimeEl = document.getElementById('raceAlgoTime');
        raceCanvasSection = document.getElementById('raceCanvasSection');
        canvasContainer = document.getElementById('canvasContainer');
        startRaceBtn = document.getElementById('startRaceBtn');

        if (!canvas) {
            throw new Error('Canvas element not found');
        }

        // Initialize renderers
        renderer = new Renderer(canvas);
        if (raceCanvas) {
            raceRenderer = new Renderer(raceCanvas);
        }

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

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (isAnimating) return;
        
        // Don't trigger shortcuts when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (e.key.toLowerCase()) {
            case 'n':
                generateNewGraph();
                break;
            case 'r':
                resetUserPath();
                break;
            case 'd':
                runDijkstraVisualization();
                break;
        }
    });

    // Make functions available globally for onclick handlers
    window.generateGraph = generateNewGraph;
    window.resetProgress = resetUserPath;
    window.runDijkstraAnimation = runDijkstraVisualization;
    window.toggleRaceMode = toggleRaceMode;
    window.setRaceDifficulty = setRaceDifficulty;
    window.startRaceFromButton = startRaceFromButton;
}

/**
 * Handle canvas click events
 */
function handleCanvasClick(e) {
    if (isAnimating || !graphData) return;
    
    // Only handle clicks on the user canvas, not race canvas
    if (e.target !== canvas) return;

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
            const userDistance = calculatePathWeight(userPath, graphData.nodes);
            let message = "Path Complete! ";
            
            // Update race mode stats if active
            if (raceMode && raceStartTime) {
                const userTime = ((Date.now() - raceStartTime) / 1000).toFixed(1);
                if (raceUserDistEl) raceUserDistEl.textContent = userDistance;
                if (raceUserTimeEl) raceUserTimeEl.textContent = userTime + 's';

                // Compare with algorithm
                if (raceAlgoComplete && raceAlgoDistance !== null) {
                    if (userDistance === raceAlgoDistance) {
                        message += "Tie! Same distance as algorithm.";
                        statusMsgEl.style.color = "#4CAF50";
                    } else if (userDistance < raceAlgoDistance) {
                        message += `You beat the algorithm! (${raceAlgoDistance - userDistance} units better)`;
                        statusMsgEl.style.color = "#4CAF50";
                    } else {
                        message += `Algorithm was better by ${userDistance - raceAlgoDistance} units.`;
                        statusMsgEl.style.color = "#FF9800";
                    }
                } else {
                    message += "Waiting for algorithm...";
                    statusMsgEl.style.color = "#aaa";
                }
            } else if (optimalDistance !== null) {
                if (userDistance === optimalDistance) {
                    message += "Perfect! You found the optimal path!";
                    statusMsgEl.style.color = "#4CAF50";
                } else {
                    const difference = userDistance - optimalDistance;
                    message += `You were ${difference} unit${difference !== 1 ? 's' : ''} longer than optimal.`;
                    statusMsgEl.style.color = "#FF9800";
                }
            } else {
                message += "Check your score.";
                statusMsgEl.style.color = "#4CAF50";
            }
            
            statusMsgEl.innerText = message;
        } else if (raceMode && raceStartTime) {
            // Update race stats in real-time
            const userDistance = calculatePathWeight(userPath, graphData.nodes);
            const userTime = ((Date.now() - raceStartTime) / 1000).toFixed(1);
            if (raceUserDistEl) raceUserDistEl.textContent = userDistance;
            if (raceUserTimeEl) raceUserTimeEl.textContent = userTime + 's';
        }
    }
}

/**
 * Deep clone graph data for race mode
 */
function cloneGraphData(graphData) {
    // Clone nodes
    const clonedNodes = graphData.nodes.map(node => {
        const clonedNode = {
            id: node.id,
            label: node.label,
            x: node.x,
            y: node.y,
            neighbors: node.neighbors.map(n => ({ id: n.id, weight: n.weight }))
        };
        return clonedNode;
    });

    // Clone edges
    const clonedEdges = graphData.edges.map(edge => ({
        from: edge.from,
        to: edge.to,
        weight: edge.weight
    }));

    return {
        nodes: clonedNodes,
        edges: clonedEdges,
        startNode: graphData.startNode,
        endNode: graphData.endNode
    };
}

/**
 * Toggle race mode on/off
 */
function toggleRaceMode() {
    raceMode = !raceMode;

    if (raceMode) {
        // Enable race mode
        if (raceCanvasSection) {
            raceCanvasSection.style.display = 'block';
        }
        if (raceStatsEl) {
            raceStatsEl.style.display = 'flex';
        }
        if (canvasContainer) {
            canvasContainer.classList.add('race-mode');
        }
        if (raceBtn) {
            raceBtn.textContent = 'Exit Race Mode';
            raceBtn.style.background = '#F44336';
        }

        // Initialize difficulty selector
        const difficultyBtns = document.querySelectorAll('.difficulty-btn');
        difficultyBtns.forEach(btn => {
            if (btn.dataset.difficulty === raceDifficulty) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Clone graph for race mode
        if (graphData) {
            raceGraphData = cloneGraphData(graphData);
            startRace();
        }
    } else {
        // Disable race mode
        if (raceCanvasSection) {
            raceCanvasSection.style.display = 'none';
        }
        if (raceStatsEl) {
            raceStatsEl.style.display = 'none';
        }
        if (canvasContainer) {
            canvasContainer.classList.remove('race-mode');
        }
        if (raceBtn) {
            raceBtn.textContent = 'Race Mode';
            raceBtn.style.background = '#2196F3';
        }

        raceGraphData = null;
        raceStartTime = null;
        raceAlgoComplete = false;
    }

    render();
    if (raceMode && raceRenderer) {
        renderRace();
    }
}

/**
 * Set race difficulty
 */
function setRaceDifficulty(difficulty) {
    if (!['easy', 'medium', 'hard'].includes(difficulty)) return;
    
    raceDifficulty = difficulty;
    
    // Update button styles
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        if (btn.dataset.difficulty === difficulty) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Don't auto-restart - user must click Start Race button
}

/**
 * Start race from button click - generates new graph and starts race
 */
function startRaceFromButton() {
    if (!raceMode || raceStarted) return;
    
    // Disable start button
    if (startRaceBtn) {
        startRaceBtn.disabled = true;
        startRaceBtn.textContent = 'Race Started';
    }
    
    // Generate new graph for race
    generateRaceGraph();
}

/**
 * Generate new graph for race mode
 */
function generateRaceGraph() {
    if (!raceMode) return;
    
    // Show loading message
    if (statusMsgEl) {
        statusMsgEl.innerText = "Generating race graph...";
        statusMsgEl.style.color = "#aaa";
    }

    // Generate new graph
    graphData = generateGraph({
        nodeCount: DEFAULT_NODE_COUNT,
        connectivityRadius: DEFAULT_CONNECTIVITY_RADIUS,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
    });

    // Clone for race canvas
    raceGraphData = cloneGraphData(graphData);
    
    // Reset user path
    userPath = [graphData.startNode];
    optimalPath = [];
    optimalDistance = null;

    // Start the race
    raceStarted = true;
    startRace();
}

/**
 * Start race mode - run algorithm automatically with visualization
 */
async function startRace() {
    if (!raceMode || !raceGraphData || !raceStarted) return;

    raceStartTime = Date.now();
    raceAlgoComplete = false;
    raceAlgoDistance = null;
    raceAlgoTime = null;
    raceAnimationHighlight = null;
    raceAnimationVisited = [];

    // Reset race UI
    if (raceUserDistEl) raceUserDistEl.textContent = '0';
    if (raceUserTimeEl) raceUserTimeEl.textContent = '0.0s';
    if (raceAlgoDistEl) raceAlgoDistEl.textContent = '?';
    if (raceAlgoTimeEl) raceAlgoTimeEl.textContent = '?';

    // Render both canvases with new graph
    render();
    renderRace();

    // Get speed based on difficulty
    const speed = RACE_SPEEDS[raceDifficulty] || RACE_SPEEDS.medium;

    // Run Dijkstra on race canvas with visualization
    const onStep = (currentNode, visited, distances) => {
        raceAnimationHighlight = currentNode;
        raceAnimationVisited = visited;
        renderRace();
    };

    const onComplete = (result) => {
        const endTime = Date.now();
        raceAlgoComplete = true;
        raceAlgoDistance = result.distance;
        raceAlgoTime = ((endTime - raceStartTime) / 1000).toFixed(1);

        if (raceAlgoDistEl) raceAlgoDistEl.textContent = result.distance || '?';
        if (raceAlgoTimeEl) raceAlgoTimeEl.textContent = raceAlgoTime + 's';

        // Clear animation state and show optimal path
        raceAnimationHighlight = null;
        raceAnimationVisited = [];
        renderRace(result.path);
    };

    // Run algorithm with visualization at selected speed
    await dijkstraAnimated(
        raceGraphData.nodes,
        raceGraphData.startNode,
        raceGraphData.endNode,
        onStep,
        onComplete,
        speed
    );
}

/**
 * Render race canvas with animation state
 */
function renderRace(optimalPath = null) {
    if (!raceMode || !raceRenderer) return;
    
    // If race hasn't started, show black canvas
    if (!raceStarted || !raceGraphData) {
        raceRenderer.clear();
        return;
    }
    
    // If algorithm is complete, show optimal path
    if (raceAlgoComplete && optimalPath) {
        raceRenderer.draw(raceGraphData, [], [], [], optimalPath);
    } else {
        // Show animation state during algorithm execution
        const highlightNodes = raceAnimationHighlight !== null ? [raceAnimationHighlight] : [];
        raceRenderer.draw(raceGraphData, [], highlightNodes, raceAnimationVisited, []);
    }
}

/**
 * Generate a new graph
 */
function generateNewGraph() {
    // Show loading message
    if (statusMsgEl) {
        statusMsgEl.innerText = "Generating graph...";
        statusMsgEl.style.color = "#aaa";
    }

    graphData = generateGraph({
        nodeCount: DEFAULT_NODE_COUNT,
        connectivityRadius: DEFAULT_CONNECTIVITY_RADIUS,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
    });

    userPath = [graphData.startNode];
    optimalPath = [];
    optimalDistance = null;
    isAnimating = false;
    
    if (algoBtn) {
        algoBtn.disabled = false;
    }

    if (targetDistEl) {
        targetDistEl.textContent = "?";
    }

    // If race mode is active and race has started, reset race
    if (raceMode && raceStarted) {
        raceGraphData = cloneGraphData(graphData);
        userPath = [graphData.startNode];
        raceStarted = false;
        raceAlgoComplete = false;
        if (startRaceBtn) {
            startRaceBtn.disabled = false;
            startRaceBtn.textContent = 'Start Race';
        }
        renderRace();
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
    optimalPath = [];
    optimalDistance = null;

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
            optimalPath = result.path;
            optimalDistance = result.distance;
            
            if (targetDistEl) {
                targetDistEl.textContent = result.distance;
            }
            
            statusMsgEl.innerText = `Optimal path found! Distance: ${result.distance}`;
            statusMsgEl.style.color = "#4CAF50";
            
            // Show the optimal path
            render();
        } else {
            statusMsgEl.innerText = "No path found between start and end nodes.";
            statusMsgEl.style.color = "#F44336";
            optimalPath = [];
            optimalDistance = null;
        }
    };

    // Run animated algorithm with slower delay for better visibility
    await dijkstraAnimated(
        graphData.nodes,
        graphData.startNode,
        graphData.endNode,
        onStep,
        onComplete,
        450 // Increased from 300ms for better visibility
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
    if (currentDistEl) {
        currentDistEl.textContent = userDistance;
    }

    // Update race mode stats if active
    if (raceMode && raceStartTime) {
        const userTime = ((Date.now() - raceStartTime) / 1000).toFixed(1);
        if (raceUserDistEl) raceUserDistEl.textContent = userDistance;
        if (raceUserTimeEl) raceUserTimeEl.textContent = userTime + 's';
    }

    // Reset status message if path is incomplete
    if (userPath[userPath.length - 1] !== graphData.endNode) {
        if (statusMsgEl) {
            statusMsgEl.innerText = raceMode ? "Race in progress! Find the shortest path." : "Select neighbors to move.";
            statusMsgEl.style.color = "#aaa";
        }
    }
}

/**
 * Render the graph
 */
function render() {
    if (!graphData || !renderer) return;

    // Determine which nodes to highlight
    let highlightNodes = [];
    let visitedNodes = [];
    let pathToShow = [];

    // If we're animating, use current animation state
    if (isAnimating) {
        if (animationHighlight !== null) {
            highlightNodes = [animationHighlight];
        }
        visitedNodes = animationVisited;
    } else {
        // Show optimal path if available
        pathToShow = optimalPath;
    }

    renderer.draw(
        graphData,
        userPath,
        highlightNodes,
        visitedNodes,
        pathToShow
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

