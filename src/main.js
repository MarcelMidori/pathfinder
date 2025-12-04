/**
 * main.js
 * Main game loop, initialization, and event handling
 */

import { generateGraph, DEFAULT_NODE_COUNT, DEFAULT_CONNECTIVITY_RADIUS } from './graph.js';
import { Renderer } from './renderer.js';
import { 
    dijkstraAnimated, 
    aStarAnimated,
    bfsAnimated,
    dfsAnimated,
    greedyBestFirstAnimated,
    calculatePathWeight 
} from './algorithms.js';

// Game state
let graphData = null;
let raceGraphData = null; // Duplicate graph for race mode
let userPath = [];
let userPathCosts = {}; // Map of node ID to cumulative cost in user path
let optimalPath = []; // Store optimal path from Dijkstra
let optimalDistance = null; // Store optimal distance
let isAnimating = false;
let renderer = null;
let raceRenderer = null; // Renderer for race mode canvas
let algo1Renderer = null; // Renderer for algorithm 1 canvas
let algo2Renderer = null; // Renderer for algorithm 2 canvas

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
let raceAnimationDistances = {}; // Store distances during race Dijkstra visualization
let raceFinalDistances = {};     // Store final distances after race algorithm completes

// Algorithm race mode state
let algoRaceMode = false;
let algoRaceStarted = false;
let selectedAlgo1 = 'dijkstra';
let selectedAlgo2 = 'astar';
let executionMode = 'simultaneous'; // 'simultaneous' or 'sequential'
let algoRaceGraphData = null;
let algo1Result = null;
let algo2Result = null;
let algo1StartTime = null;
let algo2StartTime = null;
let algo1Complete = false;
let algo2Complete = false;
let algo1AnimationHighlight = null;
let algo1AnimationVisited = [];
let algo1AnimationDistances = {};
let algo1FinalDistances = {};
let algo2AnimationHighlight = null;
let algo2AnimationVisited = [];
let algo2AnimationDistances = {};
let algo2FinalDistances = {};

// Animation state
let animationHighlight = null;
let animationVisited = [];
let animationDistances = {}; // Store distances during Dijkstra visualization
let finalDistances = {}; // Store final distances after algorithm completes

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
let raceResultSection = null;
let raceResultTitleEl = null;
let raceResultMessageEl = null;
let algoRaceBtn = null;
let algoRaceStatsEl = null;
let algo1Select = null;
let algo2Select = null;
let algo1DistEl = null;
let algo1TimeEl = null;
let algo2DistEl = null;
let algo2TimeEl = null;
let algo1CanvasSection = null;
let algo2CanvasSection = null;
let algo1Canvas = null;
let algo2Canvas = null;
let algo1CanvasLabel = null;
let algo2CanvasLabel = null;
let startAlgoRaceBtn = null;
let algoRaceResultSection = null;
let algoRaceResultTitleEl = null;
let algoRaceResultMessageEl = null;

// Race difficulty speeds (delay in milliseconds)
const RACE_SPEEDS = {
    easy: 1000,  // Very slow - much easier to beat
    medium: 300, // Medium speed
    hard: 150    // Fast - harder to beat
};

// Algorithm speed (delay in milliseconds)
const ALGO_RACE_SPEED = 100;

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
        raceResultSection = document.getElementById('raceResultSection');
        raceResultTitleEl = document.getElementById('raceResultTitle');
        raceResultMessageEl = document.getElementById('raceResultMessage');
        algoRaceBtn = document.getElementById('algoRaceBtn');
        algoRaceStatsEl = document.getElementById('algoRaceStats');
        algo1Select = document.getElementById('algo1Select');
        algo2Select = document.getElementById('algo2Select');
        algo1DistEl = document.getElementById('algo1Dist');
        algo1TimeEl = document.getElementById('algo1Time');
        algo2DistEl = document.getElementById('algo2Dist');
        algo2TimeEl = document.getElementById('algo2Time');
        algo1CanvasSection = document.getElementById('algo1CanvasSection');
        algo2CanvasSection = document.getElementById('algo2CanvasSection');
        algo1Canvas = document.getElementById('algo1Canvas');
        algo2Canvas = document.getElementById('algo2Canvas');
        algo1CanvasLabel = document.getElementById('algo1CanvasLabel');
        algo2CanvasLabel = document.getElementById('algo2CanvasLabel');
        startAlgoRaceBtn = document.getElementById('startAlgoRaceBtn');
        algoRaceResultSection = document.getElementById('algoRaceResultSection');
        algoRaceResultTitleEl = document.getElementById('algoRaceResultTitle');
        algoRaceResultMessageEl = document.getElementById('algoRaceResultMessage');

        if (!canvas) {
            throw new Error('Canvas element not found');
        }

        // Initialize renderers
        renderer = new Renderer(canvas);
        if (raceCanvas) {
            raceRenderer = new Renderer(raceCanvas);
        }
        if (algo1Canvas) {
            algo1Renderer = new Renderer(algo1Canvas);
        }
        if (algo2Canvas) {
            algo2Renderer = new Renderer(algo2Canvas);
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
    window.startNewRace = startNewRace;
    window.toggleAlgorithmRaceMode = toggleAlgorithmRaceMode;
    window.setAlgorithm1 = setAlgorithm1;
    window.setAlgorithm2 = setAlgorithm2;
    window.setExecutionMode = setExecutionMode;
    window.startAlgorithmRaceFromButton = startAlgorithmRaceFromButton;
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
        // Recalculate costs after undo
        calculateUserPathCosts();
        updateUI();
        render();
        return;
    }

    // Check if neighbor
    const lastNode = graphData.nodes[lastNodeId];
    const isNeighbor = lastNode.neighbors.some(n => n.id === nodeId);

    if (isNeighbor && !userPath.includes(nodeId)) {
        userPath.push(nodeId);
        // Calculate cumulative cost up to this node
        calculateUserPathCosts();
        updateUI();
        render();

        // Check if path is complete
        if (nodeId === graphData.endNode) {
            const userDistance = calculatePathWeight(userPath, graphData.nodes);
            if (statusMsgEl) {
                if (optimalDistance !== null) {
                    const diff = userDistance - optimalDistance;
                    if (diff === 0) {
                        statusMsgEl.innerText = "Perfect! You found the optimal path!";
                        statusMsgEl.style.color = "#4CAF50";
                    } else {
                        statusMsgEl.innerText = `Path complete! You were ${diff} units longer than optimal.`;
                        statusMsgEl.style.color = "#FFD700";
                    }
                } else {
                    statusMsgEl.innerText = `Path complete! Distance: ${userDistance}`;
                    statusMsgEl.style.color = "#4CAF50";
                }
            }
        }
    }
}

/**
 * Clone graph data for race mode
 */
function cloneGraphData(graphData) {
    const clonedNodes = graphData.nodes.map(node => ({
        id: node.id,
        label: node.label,
        x: node.x,
        y: node.y,
        neighbors: node.neighbors.map(edge => ({
            id: edge.id,
            weight: edge.weight
        }))
    }));

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

        // Reset race state - don't start automatically
        raceStarted = false;
        raceGraphData = null;
        graphData = null; // Clear graph data so both canvases are black
        raceStartTime = null;
        raceAlgoComplete = false;
        raceAlgoDistance = null;
        raceAlgoTime = null;
        raceAnimationHighlight = null;
        raceAnimationVisited = [];
        raceAnimationDistances = {};
        raceFinalDistances = {};
        userPath = [];
        userPathCosts = {};

        // Reset UI
        if (raceUserDistEl) raceUserDistEl.textContent = '0';
        if (raceUserTimeEl) raceUserTimeEl.textContent = '0.0s';
        if (raceAlgoDistEl) raceAlgoDistEl.textContent = '?';
        if (raceAlgoTimeEl) raceAlgoTimeEl.textContent = '?';
        if (startRaceBtn) {
            startRaceBtn.disabled = false;
            startRaceBtn.textContent = 'Start Race';
        }
        if (raceResultSection) {
            raceResultSection.style.display = 'none';
        }

        // Show black canvas (no graph yet) on both canvases
        render();
        if (raceRenderer) {
            renderRace();
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
        if (raceResultSection) {
            raceResultSection.style.display = 'none';
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
    raceDifficulty = difficulty;
    
    // Update button states
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    difficultyBtns.forEach(btn => {
        if (btn.dataset.difficulty === difficulty) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Start race from button click
 * Also handles "New Race" functionality when race is complete
 */
function startRaceFromButton() {
    if (!raceMode) return;
    
    // If race is complete, start new race
    if (raceStarted && raceAlgoComplete) {
        startNewRace();
        return;
    }

    if (raceStarted) return;
    
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
    userPathCosts = {};
    calculateUserPathCosts();
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
    raceAnimationDistances = {};
    raceFinalDistances = {};
    userPathCosts = {};

    // Reset race UI
    if (raceUserDistEl) raceUserDistEl.textContent = '0';
    if (raceUserTimeEl) raceUserTimeEl.textContent = '0.0s';
    if (raceAlgoDistEl) raceAlgoDistEl.textContent = '?';
    if (raceAlgoTimeEl) raceAlgoTimeEl.textContent = '?';

    // Render both canvases with new graph
    // Note: render() will show the graph on user canvas, renderRace() will show on algorithm canvas
    render();
    renderRace();

    // Get speed based on difficulty
    const speed = RACE_SPEEDS[raceDifficulty] || RACE_SPEEDS.medium;

    // Run Dijkstra on race canvas with visualization
    const onStep = (currentNode, visited, distances) => {
        raceAnimationHighlight = currentNode;
        raceAnimationVisited = visited;
        raceAnimationDistances = distances; // Store distances for cost display
        renderRace();
    };

    const onComplete = (result) => {
        const endTime = Date.now();
        raceAlgoComplete = true;
        raceAlgoDistance = result.distance;
        raceAlgoTime = ((endTime - raceStartTime) / 1000).toFixed(1);

        if (raceAlgoDistEl) raceAlgoDistEl.textContent = result.distance || '?';
        if (raceAlgoTimeEl) raceAlgoTimeEl.textContent = raceAlgoTime + 's';

        // Store final distances to keep costs displayed
        raceFinalDistances = raceAnimationDistances;

        // Clear animation highlight but keep distances
        raceAnimationHighlight = null;
        raceAnimationVisited = [];
        // Keep raceAnimationDistances for final display
        renderRace(result.path);
        
        // Check if user has completed their path and show result
        checkRaceResult();
    };

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
 * Check race result and display winner
 */
function checkRaceResult() {
    if (!raceAlgoComplete) return;
    
    const userDistance = calculatePathWeight(userPath, graphData.nodes);
    const userTime = raceStartTime ? ((Date.now() - raceStartTime) / 1000).toFixed(1) : '0.0';
    
    if (raceUserDistEl) raceUserDistEl.textContent = userDistance;
    if (raceUserTimeEl) raceUserTimeEl.textContent = userTime + 's';
    
    // Only show result if user has completed path
    if (userPath.length > 0 && userPath[userPath.length - 1] === graphData.endNode) {
        if (raceResultSection) {
            raceResultSection.style.display = 'block';
        }
        
        if (userDistance < raceAlgoDistance) {
            if (raceResultTitleEl) raceResultTitleEl.textContent = 'You Won!';
            if (raceResultMessageEl) {
                raceResultMessageEl.textContent = `You found a shorter path (${userDistance} vs ${raceAlgoDistance})!`;
            }
        } else if (userDistance === raceAlgoDistance) {
            if (raceResultTitleEl) raceResultTitleEl.textContent = 'Tie!';
            if (raceResultMessageEl) {
                raceResultMessageEl.textContent = `Both found optimal path (${userDistance})!`;
            }
        } else {
            if (raceResultTitleEl) raceResultTitleEl.textContent = 'You Lost';
            if (raceResultMessageEl) {
                raceResultMessageEl.textContent = `Algorithm found shorter path (${raceAlgoDistance} vs ${userDistance})`;
            }
        }
        
        // Update button to "New Race"
        if (startRaceBtn) {
            startRaceBtn.disabled = false;
            startRaceBtn.textContent = 'New Race';
        }
    }
}

/**
 * Start a new race
 */
function startNewRace() {
    if (!raceMode) return;
    
    // Hide result
    if (raceResultSection) {
        raceResultSection.style.display = 'none';
    }
    
    // Reset race state
    raceStarted = false;
    raceGraphData = null;
    graphData = null;
    userPath = [];
    raceStartTime = null;
    raceAlgoComplete = false;
    raceAlgoDistance = null;
    raceAlgoTime = null;
    raceAnimationHighlight = null;
    raceAnimationVisited = [];
    raceAnimationDistances = {};
    raceFinalDistances = {};
    
    // Reset UI
    if (raceUserDistEl) raceUserDistEl.textContent = '0';
    if (raceUserTimeEl) raceUserTimeEl.textContent = '0.0s';
    if (raceAlgoDistEl) raceAlgoDistEl.textContent = '?';
    if (raceAlgoTimeEl) raceAlgoTimeEl.textContent = '?';
    if (startRaceBtn) {
        startRaceBtn.disabled = false;
        startRaceBtn.textContent = 'Start Race';
    }
    if (statusMsgEl) {
        statusMsgEl.innerText = 'Select difficulty and click Start Race';
        statusMsgEl.style.color = '#aaa';
    }
    
    // Show black canvases
    render();
    renderRace();
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
    
    // If algorithm is complete, show optimal path with final distances
    if (raceAlgoComplete && optimalPath) {
        // Use final distances if available, otherwise use current animation distances
        const distancesToShow = Object.keys(raceFinalDistances).length > 0 ? raceFinalDistances : raceAnimationDistances;
        raceRenderer.draw(raceGraphData, [], [], [], optimalPath, {}, distancesToShow);
    } else {
        // Show animation state during algorithm execution
        const highlightNodes = raceAnimationHighlight !== null ? [raceAnimationHighlight] : [];
        raceRenderer.draw(raceGraphData, [], highlightNodes, raceAnimationVisited, [], {}, raceAnimationDistances);
    }
}

/**
 * Generate a new graph
 */
function generateNewGraph() {
    // Don't generate graph if in race mode (race mode has its own graph generation)
    if (raceMode) {
        return;
    }
    
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
    userPathCosts = {};
    calculateUserPathCosts();
    optimalPath = [];
    optimalDistance = null;
    isAnimating = false;
    finalDistances = {};
    
    if (algoBtn) {
        algoBtn.disabled = false;
    }

    if (targetDistEl) {
        targetDistEl.textContent = "?";
    }

    updateUI();
    render();
}

/**
 * Update UI elements
 */
function updateUI() {
    if (!graphData) return;

    // Calculate current path distance
    const currentDistance = userPath.length > 1 
        ? calculatePathWeight(userPath, graphData.nodes)
        : 0;

    if (currentDistEl) {
        currentDistEl.textContent = currentDistance;
    }

    // Update race mode UI if active
    if (raceMode && raceStarted) {
        const userDistance = calculatePathWeight(userPath, graphData.nodes);
        const userTime = raceStartTime ? ((Date.now() - raceStartTime) / 1000).toFixed(1) : '0.0';
        
        if (raceUserDistEl) raceUserDistEl.textContent = userDistance;
        if (raceUserTimeEl) raceUserTimeEl.textContent = userTime + 's';
        
        // Check result if algorithm is complete
        if (raceAlgoComplete) {
            checkRaceResult();
        }
    }
}

/**
 * Calculate cumulative costs for user path
 */
function calculateUserPathCosts() {
    userPathCosts = {};
    if (userPath.length === 0 || !graphData) return;
    
    let cumulativeCost = 0;
    userPathCosts[userPath[0]] = cumulativeCost;
    
    for (let i = 0; i < userPath.length - 1; i++) {
        const currentNodeId = userPath[i];
        const nextNodeId = userPath[i + 1];
        const currentNode = graphData.nodes[currentNodeId];
        const neighbor = currentNode.neighbors.find(n => n.id === nextNodeId);
        
        if (neighbor) {
            cumulativeCost += neighbor.weight;
            userPathCosts[nextNodeId] = cumulativeCost;
        }
    }
}

/**
 * Reset user path to start
 */
function resetUserPath() {
    if (isAnimating || !graphData) return;
    userPath = [graphData.startNode];
    calculateUserPathCosts();
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
    animationDistances = {};
    finalDistances = {};
    optimalPath = [];
    optimalDistance = null;

    // Step callback for visualization
    const onStep = (currentNode, visited, distances) => {
        animationHighlight = currentNode;
        animationVisited = visited;
        // Store distances for rendering
        animationDistances = distances;
        render();
    };

    // Completion callback
    const onComplete = (result) => {
        isAnimating = false;
        if (algoBtn) {
            algoBtn.disabled = false;
        }

        // Store final distances to keep costs displayed
        finalDistances = animationDistances;

        if (result.path.length > 0 && result.distance !== null) {
            optimalPath = result.path;
            optimalDistance = result.distance;
            
            if (targetDistEl) {
                targetDistEl.textContent = optimalDistance;
            }
            
            // Show the optimal path with final distances
            render();
        } else {
            statusMsgEl.innerText = "No path found between start and end nodes.";
            statusMsgEl.style.color = "#F44336";
        }
    };

    await dijkstraAnimated(
        graphData.nodes,
        graphData.startNode,
        graphData.endNode,
        onStep,
        onComplete,
        300
    );
}

/**
 * Render the graph
 */
function render() {
    if (!renderer) return;
    
    // In race mode, show black canvas if race hasn't started
    if (raceMode && (!raceStarted || !graphData)) {
        renderer.clear();
        return;
    }
    
    // In normal mode, if no graph data, clear canvas
    if (!graphData) {
        renderer.clear();
        return;
    }

    // Determine which nodes to highlight
    let highlightNodes = [];
    let visitedNodes = [];
    let pathToShow = [];
    let distances = {};

    // If we're animating, use current animation state
    if (isAnimating) {
        if (animationHighlight !== null) {
            highlightNodes = [animationHighlight];
        }
        visitedNodes = animationVisited;
        distances = animationDistances; // Pass distances for cost display
    } else {
        // Show optimal path if available
        pathToShow = optimalPath;
        // Keep displaying final distances after algorithm completes
        if (Object.keys(finalDistances).length > 0) {
            distances = finalDistances;
        }
    }

    renderer.draw(
        graphData,
        userPath,
        highlightNodes,
        visitedNodes,
        pathToShow,
        userPathCosts,
        distances
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
}

/**
 * Toggle algorithm race mode on/off
 */
function toggleAlgorithmRaceMode() {
    algoRaceMode = !algoRaceMode;

    if (algoRaceMode) {
        // Enable algorithm race mode
        if (algo1CanvasSection) {
            algo1CanvasSection.style.display = 'block';
        }
        if (algo2CanvasSection) {
            algo2CanvasSection.style.display = 'block';
        }
        if (algoRaceStatsEl) {
            algoRaceStatsEl.style.display = 'flex';
        }
        if (canvasContainer) {
            canvasContainer.classList.add('algo-race-mode');
        }
        if (algoRaceBtn) {
            algoRaceBtn.textContent = 'Exit Algorithm Race';
            algoRaceBtn.style.background = '#F44336';
        }

        // Reset algorithm race state
        algoRaceStarted = false;
        algoRaceGraphData = null;
        algo1Result = null;
        algo2Result = null;
        algo1StartTime = null;
        algo2StartTime = null;
        algo1Complete = false;
        algo2Complete = false;
        algo1AnimationHighlight = null;
        algo1AnimationVisited = [];
        algo1AnimationDistances = {};
        algo1FinalDistances = {};
        algo2AnimationHighlight = null;
        algo2AnimationVisited = [];
        algo2AnimationDistances = {};
        algo2FinalDistances = {};

        // Reset UI
        if (algo1DistEl) algo1DistEl.textContent = '?';
        if (algo1TimeEl) algo1TimeEl.textContent = '?';
        if (algo2DistEl) algo2DistEl.textContent = '?';
        if (algo2TimeEl) algo2TimeEl.textContent = '?';
        if (startAlgoRaceBtn) {
            startAlgoRaceBtn.disabled = false;
            startAlgoRaceBtn.textContent = 'Start Race';
        }
        if (algoRaceResultSection) {
            algoRaceResultSection.style.display = 'none';
        }

        // Update canvas labels
        if (algo1CanvasLabel) {
            algo1CanvasLabel.textContent = getAlgorithmName(selectedAlgo1);
        }
        if (algo2CanvasLabel) {
            algo2CanvasLabel.textContent = getAlgorithmName(selectedAlgo2);
        }

        // Show black canvases
        renderAlgorithmRace();
    } else {
        // Disable algorithm race mode
        if (algo1CanvasSection) {
            algo1CanvasSection.style.display = 'none';
        }
        if (algo2CanvasSection) {
            algo2CanvasSection.style.display = 'none';
        }
        if (algoRaceStatsEl) {
            algoRaceStatsEl.style.display = 'none';
        }
        if (canvasContainer) {
            canvasContainer.classList.remove('algo-race-mode');
        }
        if (algoRaceBtn) {
            algoRaceBtn.textContent = 'Algorithm Race';
            algoRaceBtn.style.background = '#2196F3';
        }
        if (algoRaceResultSection) {
            algoRaceResultSection.style.display = 'none';
        }

        algoRaceGraphData = null;
    }

    renderAlgorithmRace();
}

/**
 * Get algorithm display name
 */
function getAlgorithmName(algoKey) {
    const names = {
        'dijkstra': 'Dijkstra',
        'astar': 'A*',
        'bfs': 'BFS',
        'dfs': 'DFS',
        'greedy': 'Greedy'
    };
    return names[algoKey] || algoKey;
}

/**
 * Set algorithm 1
 */
function setAlgorithm1(algoName) {
    selectedAlgo1 = algoName;
    if (algo1CanvasLabel) {
        algo1CanvasLabel.textContent = getAlgorithmName(algoName);
    }
}

/**
 * Set algorithm 2
 */
function setAlgorithm2(algoName) {
    selectedAlgo2 = algoName;
    if (algo2CanvasLabel) {
        algo2CanvasLabel.textContent = getAlgorithmName(algoName);
    }
}

/**
 * Set execution mode
 */
function setExecutionMode(mode) {
    executionMode = mode;
    
    // Update button states
    const modeBtns = document.querySelectorAll('.execution-mode-btn');
    modeBtns.forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Start algorithm race from button
 */
function startAlgorithmRaceFromButton() {
    if (!algoRaceMode) return;
    
    // If race is complete, start new race
    if (algoRaceStarted && algo1Complete && algo2Complete) {
        startNewAlgorithmRace();
        return;
    }

    if (algoRaceStarted) return;
    
    // Disable start button
    if (startAlgoRaceBtn) {
        startAlgoRaceBtn.disabled = true;
        startAlgoRaceBtn.textContent = 'Race Started';
    }
    
    // Generate new graph and start race
    generateAlgorithmRaceGraph();
}

/**
 * Generate graph for algorithm race
 */
function generateAlgorithmRaceGraph() {
    if (!algoRaceMode) return;
    
    // Show loading message
    if (statusMsgEl) {
        statusMsgEl.innerText = "Generating algorithm race graph...";
        statusMsgEl.style.color = "#aaa";
    }

    // Generate new graph
    algoRaceGraphData = generateGraph({
        nodeCount: DEFAULT_NODE_COUNT,
        connectivityRadius: DEFAULT_CONNECTIVITY_RADIUS,
        canvasWidth: algo1Canvas ? algo1Canvas.width : 800,
        canvasHeight: algo1Canvas ? algo1Canvas.height : 500
    });

    // Start the race
    algoRaceStarted = true;
    startAlgorithmRace();
}

/**
 * Start algorithm race
 */
async function startAlgorithmRace() {
    if (!algoRaceMode || !algoRaceGraphData || !algoRaceStarted) return;

    // Reset state
    algo1Result = null;
    algo2Result = null;
    algo1StartTime = null;
    algo2StartTime = null;
    algo1Complete = false;
    algo2Complete = false;
    algo1AnimationHighlight = null;
    algo1AnimationVisited = [];
    algo1AnimationDistances = {};
    algo1FinalDistances = {};
    algo2AnimationHighlight = null;
    algo2AnimationVisited = [];
    algo2AnimationDistances = {};
    algo2FinalDistances = {};

    // Reset UI
    if (algo1DistEl) algo1DistEl.textContent = '?';
    if (algo1TimeEl) algo1TimeEl.textContent = '?';
    if (algo2DistEl) algo2DistEl.textContent = '?';
    if (algo2TimeEl) algo2TimeEl.textContent = '?';

    // Render both canvases with new graph
    renderAlgorithmRace();

    if (executionMode === 'simultaneous') {
        await runSimultaneousRace();
    } else {
        await runSequentialRace();
    }
}

/**
 * Run simultaneous race (both algorithms at same time)
 */
async function runSimultaneousRace() {
    const algo1Promise = runAlgorithm(selectedAlgo1, 1);
    const algo2Promise = runAlgorithm(selectedAlgo2, 2);
    
    await Promise.all([algo1Promise, algo2Promise]);
    
    checkAlgorithmRaceResult();
}

/**
 * Run sequential race (algorithms one after another)
 */
async function runSequentialRace() {
    await runAlgorithm(selectedAlgo1, 1);
    await runAlgorithm(selectedAlgo2, 2);
    
    checkAlgorithmRaceResult();
}

/**
 * Run a single algorithm
 */
async function runAlgorithm(algoName, algoNumber) {
    const startTime = Date.now();
    let result = null;
    
    if (algoNumber === 1) {
        algo1StartTime = startTime;
    } else {
        algo2StartTime = startTime;
    }

    const onStep = (currentNode, visited, distances) => {
        if (algoNumber === 1) {
            algo1AnimationHighlight = currentNode;
            algo1AnimationVisited = visited;
            algo1AnimationDistances = distances;
        } else {
            algo2AnimationHighlight = currentNode;
            algo2AnimationVisited = visited;
            algo2AnimationDistances = distances;
        }
        renderAlgorithmRace();
    };

    const onComplete = (algoResult) => {
        const endTime = Date.now();
        const time = ((endTime - startTime) / 1000).toFixed(1);
        
        if (algoNumber === 1) {
            algo1Result = algoResult;
            algo1Complete = true;
            algo1FinalDistances = algo1AnimationDistances;
            algo1AnimationHighlight = null;
            algo1AnimationVisited = [];
            if (algo1DistEl) algo1DistEl.textContent = algoResult.distance || '?';
            if (algo1TimeEl) algo1TimeEl.textContent = time + 's';
        } else {
            algo2Result = algoResult;
            algo2Complete = true;
            algo2FinalDistances = algo2AnimationDistances;
            algo2AnimationHighlight = null;
            algo2AnimationVisited = [];
            if (algo2DistEl) algo2DistEl.textContent = algoResult.distance || '?';
            if (algo2TimeEl) algo2TimeEl.textContent = time + 's';
        }
        
        renderAlgorithmRace();
    };

    // Get the appropriate algorithm function
    const algoFunction = getAlgorithmFunction(algoName);
    
    await algoFunction(
        algoRaceGraphData.nodes,
        algoRaceGraphData.startNode,
        algoRaceGraphData.endNode,
        onStep,
        onComplete,
        ALGO_RACE_SPEED
    );
}

/**
 * Get algorithm function by name
 */
function getAlgorithmFunction(algoName) {
    const algorithms = {
        'dijkstra': dijkstraAnimated,
        'astar': aStarAnimated,
        'bfs': bfsAnimated,
        'dfs': dfsAnimated,
        'greedy': greedyBestFirstAnimated
    };
    return algorithms[algoName] || dijkstraAnimated;
}

/**
 * Check algorithm race result and display winner
 */
function checkAlgorithmRaceResult() {
    if (!algo1Complete || !algo2Complete) return;
    
    if (algoRaceResultSection) {
        algoRaceResultSection.style.display = 'block';
    }
    
    const dist1 = algo1Result.distance;
    const dist2 = algo2Result.distance;
    
    // Handle cases where no path was found
    if (dist1 === null && dist2 === null) {
        if (algoRaceResultTitleEl) algoRaceResultTitleEl.textContent = 'Tie - No Path';
        if (algoRaceResultMessageEl) {
            algoRaceResultMessageEl.textContent = 'Both algorithms failed to find a path.';
        }
    } else if (dist1 === null) {
        if (algoRaceResultTitleEl) algoRaceResultTitleEl.textContent = getAlgorithmName(selectedAlgo2) + ' Won!';
        if (algoRaceResultMessageEl) {
            algoRaceResultMessageEl.textContent = `${getAlgorithmName(selectedAlgo1)} found no path. ${getAlgorithmName(selectedAlgo2)} found path with cost ${dist2}.`;
        }
    } else if (dist2 === null) {
        if (algoRaceResultTitleEl) algoRaceResultTitleEl.textContent = getAlgorithmName(selectedAlgo1) + ' Won!';
        if (algoRaceResultMessageEl) {
            algoRaceResultMessageEl.textContent = `${getAlgorithmName(selectedAlgo2)} found no path. ${getAlgorithmName(selectedAlgo1)} found path with cost ${dist1}.`;
        }
    } else if (dist1 < dist2) {
        if (algoRaceResultTitleEl) algoRaceResultTitleEl.textContent = getAlgorithmName(selectedAlgo1) + ' Won!';
        if (algoRaceResultMessageEl) {
            algoRaceResultMessageEl.textContent = `${getAlgorithmName(selectedAlgo1)} found shorter path (${dist1} vs ${dist2}).`;
        }
    } else if (dist2 < dist1) {
        if (algoRaceResultTitleEl) algoRaceResultTitleEl.textContent = getAlgorithmName(selectedAlgo2) + ' Won!';
        if (algoRaceResultMessageEl) {
            algoRaceResultMessageEl.textContent = `${getAlgorithmName(selectedAlgo2)} found shorter path (${dist2} vs ${dist1}).`;
        }
    } else {
        if (algoRaceResultTitleEl) algoRaceResultTitleEl.textContent = 'Tie!';
        if (algoRaceResultMessageEl) {
            algoRaceResultMessageEl.textContent = `Both algorithms found optimal path (${dist1}).`;
        }
    }
    
    // Update button to "New Race"
    if (startAlgoRaceBtn) {
        startAlgoRaceBtn.disabled = false;
        startAlgoRaceBtn.textContent = 'New Race';
    }
}

/**
 * Start a new algorithm race
 */
function startNewAlgorithmRace() {
    if (!algoRaceMode) return;
    
    // Hide result
    if (algoRaceResultSection) {
        algoRaceResultSection.style.display = 'none';
    }
    
    // Reset race state
    algoRaceStarted = false;
    algoRaceGraphData = null;
    algo1Result = null;
    algo2Result = null;
    algo1StartTime = null;
    algo2StartTime = null;
    algo1Complete = false;
    algo2Complete = false;
    algo1AnimationHighlight = null;
    algo1AnimationVisited = [];
    algo1AnimationDistances = {};
    algo1FinalDistances = {};
    algo2AnimationHighlight = null;
    algo2AnimationVisited = [];
    algo2AnimationDistances = {};
    algo2FinalDistances = {};
    
    // Reset UI
    if (algo1DistEl) algo1DistEl.textContent = '?';
    if (algo1TimeEl) algo1TimeEl.textContent = '?';
    if (algo2DistEl) algo2DistEl.textContent = '?';
    if (algo2TimeEl) algo2TimeEl.textContent = '?';
    if (startAlgoRaceBtn) {
        startAlgoRaceBtn.disabled = false;
        startAlgoRaceBtn.textContent = 'Start Race';
    }
    if (statusMsgEl) {
        statusMsgEl.innerText = 'Select algorithms and click Start Race';
        statusMsgEl.style.color = '#aaa';
    }
    
    // Show black canvases
    renderAlgorithmRace();
}

/**
 * Render algorithm race canvases
 */
function renderAlgorithmRace() {
    if (!algoRaceMode) return;
    
    // If race hasn't started, show black canvases
    if (!algoRaceStarted || !algoRaceGraphData) {
        if (algo1Renderer) algo1Renderer.clear();
        if (algo2Renderer) algo2Renderer.clear();
        return;
    }
    
    // Render algorithm 1 canvas
    if (algo1Renderer) {
        if (algo1Complete && algo1Result && algo1Result.path) {
            const distancesToShow = Object.keys(algo1FinalDistances).length > 0 ? algo1FinalDistances : algo1AnimationDistances;
            algo1Renderer.draw(algoRaceGraphData, [], [], [], algo1Result.path, {}, distancesToShow);
        } else {
            const highlightNodes = algo1AnimationHighlight !== null ? [algo1AnimationHighlight] : [];
            algo1Renderer.draw(algoRaceGraphData, [], highlightNodes, algo1AnimationVisited, [], {}, algo1AnimationDistances);
        }
    }
    
    // Render algorithm 2 canvas
    if (algo2Renderer) {
        if (algo2Complete && algo2Result && algo2Result.path) {
            const distancesToShow = Object.keys(algo2FinalDistances).length > 0 ? algo2FinalDistances : algo2AnimationDistances;
            algo2Renderer.draw(algoRaceGraphData, [], [], [], algo2Result.path, {}, distancesToShow);
        } else {
            const highlightNodes = algo2AnimationHighlight !== null ? [algo2AnimationHighlight] : [];
            algo2Renderer.draw(algoRaceGraphData, [], highlightNodes, algo2AnimationVisited, [], {}, algo2AnimationDistances);
        }
    }
}
