/**
 * main.js
 * Main game loop, initialization, and event handling
 */

import { generateGraph, DEFAULT_NODE_COUNT, DEFAULT_CONNECTIVITY_RADIUS } from './graph.js';
import { Renderer } from './renderer.js';
import { 
    dijkstra,
    dijkstraAnimated, 
    aStar,
    aStarAnimated,
    bfs,
    bfsAnimated,
    dfs,
    dfsAnimated,
    calculatePathWeight 
} from './algorithms.js';

// Tab state
let activeTab = 'explore'; // 'explore', 'race', 'compare'

// Game state
let graphData = null;
let raceGraphData = null; // Duplicate graph for race mode
let userPath = [];
let userPathCosts = {}; // Map of node ID to cumulative cost in user path
let optimalPath = []; // Store optimal path from Dijkstra
let optimalDistance = null; // Store optimal distance
let isAnimating = false;
let renderer = null;
let raceUserRenderer = null; // Renderer for race user canvas
let raceRenderer = null; // Renderer for race algorithm canvas
let algoDijkstraRenderer = null;
let algoAstarRenderer = null;
let algoBfsRenderer = null;
let algoDfsRenderer = null;

// Race mode state
let raceStarted = false; // Whether race has been started
let raceStartTime = null;
let raceAlgoComplete = false;
let raceAlgoDistance = null;
let raceAlgoTime = null;
let raceUserComplete = false; // Whether user has finished their path
let raceUserFinalTime = null; // Store user's time when they finish
let raceDifficulty = 'easy'; // 'easy', 'medium', 'hard'
let raceAlgorithm = 'dijkstra'; // Selected algorithm for race
let raceAnimationHighlight = null;
let raceAnimationVisited = [];
let raceAnimationDistances = {}; // Store distances during race algorithm visualization
let raceFinalDistances = {};     // Store final distances after race algorithm completes

// Algorithm race mode (Compare tab) state
let algoRaceStarted = false;
let algoRaceGraphData = null;
const algoResults = {
    dijkstra: { result: null, startTime: null, complete: false, highlight: null, visited: [], distances: {}, finalDistances: {} },
    astar: { result: null, startTime: null, complete: false, highlight: null, visited: [], distances: {}, finalDistances: {} },
    bfs: { result: null, startTime: null, complete: false, highlight: null, visited: [], distances: {}, finalDistances: {} },
    dfs: { result: null, startTime: null, complete: false, highlight: null, visited: [], distances: {}, finalDistances: {} }
};

// Animation state
let animationHighlight = null;
let animationVisited = [];
let animationDistances = {}; // Store distances during Dijkstra visualization
let finalDistances = {}; // Store final distances after algorithm completes

// DOM elements
let canvas = null;
let raceUserCanvas = null;
let raceCanvas = null;
let algoBtn = null;
let targetDistEl = null;
let currentDistEl = null;
let statusMsgEl = null;
let raceUserDistEl = null;
let raceUserTimeEl = null;
let raceAlgoDistEl = null;
let raceAlgoTimeEl = null;
let startRaceBtn = null;
let raceResultSection = null;
let raceResultTitleEl = null;
let raceResultMessageEl = null;
let raceAlgoLabelEl = null;
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
        // Get DOM elements - Explore tab
        canvas = document.getElementById('gameCanvas');
        algoBtn = document.getElementById('algoBtn');
        targetDistEl = document.getElementById('targetDist');
        currentDistEl = document.getElementById('currentDist');
        statusMsgEl = document.getElementById('statusMsg');
        
        // Get DOM elements - Race tab
        raceUserCanvas = document.getElementById('raceUserCanvas');
        raceCanvas = document.getElementById('raceCanvas');
        raceUserDistEl = document.getElementById('raceUserDist');
        raceUserTimeEl = document.getElementById('raceUserTime');
        raceAlgoDistEl = document.getElementById('raceAlgoDist');
        raceAlgoTimeEl = document.getElementById('raceAlgoTime');
        startRaceBtn = document.getElementById('startRaceBtn');
        raceResultSection = document.getElementById('raceResultSection');
        raceResultTitleEl = document.getElementById('raceResultTitle');
        raceResultMessageEl = document.getElementById('raceResultMessage');
        raceAlgoLabelEl = document.getElementById('raceAlgoLabel');
        
        // Get DOM elements - Compare tab
        startAlgoRaceBtn = document.getElementById('startAlgoRaceBtn');
        algoRaceResultSection = document.getElementById('algoRaceResultSection');
        algoRaceResultTitleEl = document.getElementById('algoRaceResultTitle');
        algoRaceResultMessageEl = document.getElementById('algoRaceResultMessage');
        
        // Algorithm race canvas elements
        const algoDijkstraCanvas = document.getElementById('algoDijkstraCanvas');
        const algoAstarCanvas = document.getElementById('algoAstarCanvas');
        const algoBfsCanvas = document.getElementById('algoBfsCanvas');
        const algoDfsCanvas = document.getElementById('algoDfsCanvas');

        if (!canvas) {
            throw new Error('Canvas element not found');
        }

        // Initialize renderers
        renderer = new Renderer(canvas);
        if (raceUserCanvas) raceUserRenderer = new Renderer(raceUserCanvas);
        if (raceCanvas) raceRenderer = new Renderer(raceCanvas);
        if (algoDijkstraCanvas) algoDijkstraRenderer = new Renderer(algoDijkstraCanvas);
        if (algoAstarCanvas) algoAstarRenderer = new Renderer(algoAstarCanvas);
        if (algoBfsCanvas) algoBfsRenderer = new Renderer(algoBfsCanvas);
        if (algoDfsCanvas) algoDfsRenderer = new Renderer(algoDfsCanvas);

        // Set up event listeners
        setupEventListeners();

        // Generate initial graph for explore tab
        generateNewGraph();
        
        // Initialize race tab canvases (black)
        if (raceUserRenderer) raceUserRenderer.clear();
        if (raceRenderer) raceRenderer.clear();
        
        // Initialize compare tab canvases (black)
        renderAlgorithmRace();
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
    // Canvas click handlers for explore and race tabs
    canvas.addEventListener('mousedown', handleCanvasClick);
    if (raceUserCanvas) {
        raceUserCanvas.addEventListener('mousedown', handleRaceCanvasClick);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (isAnimating) return;
        
        // Don't trigger shortcuts when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }

        switch (e.key.toLowerCase()) {
            case 'n':
                if (activeTab === 'explore') generateNewGraph();
                break;
            case 'r':
                if (activeTab === 'explore') resetUserPath();
                break;
            case 'd':
                if (activeTab === 'explore') runDijkstraVisualization();
                break;
        }
    });

    // Make functions available globally for onclick handlers
    window.switchTab = switchTab;
    window.generateGraph = generateNewGraph;
    window.resetProgress = resetUserPath;
    window.runDijkstraAnimation = runDijkstraVisualization;
    window.setRaceDifficulty = setRaceDifficulty;
    window.setRaceAlgorithm = setRaceAlgorithm;
    window.startRaceFromButton = startRaceFromButton;
    window.startAlgorithmRaceFromButton = startAlgorithmRaceFromButton;
    window.runSimulation = runSimulation;
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
    if (activeTab === tabName) return;
    
    // Update active tab
    activeTab = tabName;
    
    // Update tab button states
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update panel visibility
    const panels = document.querySelectorAll('.tab-panel');
    panels.forEach(panel => {
        panel.classList.remove('active');
    });
    
    const activePanel = document.getElementById(tabName + 'Panel');
    if (activePanel) {
        activePanel.classList.add('active');
    }
    
    // Reset state when switching tabs
    if (tabName === 'explore') {
        // Generate new graph if none exists
        if (!graphData) {
            generateNewGraph();
        }
    } else if (tabName === 'race') {
        // Reset race state
        resetRaceState();
    } else if (tabName === 'compare') {
        // Reset algorithm race state
        resetAlgoRaceState();
    }
}

/**
 * Reset race state for Race tab
 */
function resetRaceState() {
    raceStarted = false;
    raceGraphData = null;
    raceStartTime = null;
    raceAlgoComplete = false;
    raceAlgoDistance = null;
    raceAlgoTime = null;
    raceUserComplete = false;
    raceUserFinalTime = null;
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
        startRaceBtn.textContent = 'Start New Race';
    }
    if (raceResultSection) {
        raceResultSection.style.display = 'none';
    }
    
    // Clear canvases
    if (raceUserRenderer) raceUserRenderer.clear();
    if (raceRenderer) raceRenderer.clear();
}

/**
 * Reset algorithm race state for Compare tab
 */
function resetAlgoRaceState() {
    algoRaceStarted = false;
    algoRaceGraphData = null;
    
    Object.keys(algoResults).forEach(key => {
        algoResults[key] = {
            result: null,
            startTime: null,
            complete: false,
            highlight: null,
            visited: [],
            distances: {},
            finalDistances: {}
        };
    });
    
    // Reset UI
    const algoNames = ['Dijkstra', 'Astar', 'Bfs', 'Dfs'];
    algoNames.forEach(name => {
        const distEl = document.getElementById(`algo${name}Dist`);
        const timeEl = document.getElementById(`algo${name}Time`);
        if (distEl) distEl.textContent = '?';
        if (timeEl) timeEl.textContent = '?';
    });
    
    if (startAlgoRaceBtn) {
        startAlgoRaceBtn.disabled = false;
        startAlgoRaceBtn.textContent = 'Start New Race';
    }
    if (algoRaceResultSection) {
        algoRaceResultSection.style.display = 'none';
    }
    
    // Clear canvases
    renderAlgorithmRace();
}

/**
 * Set race algorithm
 */
function setRaceAlgorithm(algoName) {
    raceAlgorithm = algoName;
    
    // Update label if available
    if (raceAlgoLabelEl) {
        raceAlgoLabelEl.textContent = getAlgorithmName(algoName);
    }
}

/**
 * Handle race canvas click events (for Race tab user canvas)
 */
function handleRaceCanvasClick(e) {
    if (isAnimating || !raceGraphData || !raceStarted) return;
    
    const rect = raceUserCanvas.getBoundingClientRect();
    const scaleX = raceUserCanvas.width / rect.width;
    const scaleY = raceUserCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Find clicked node
    const clickedNode = raceGraphData.nodes.find(node => {
        const dx = node.x - x;
        const dy = node.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 20;
    });
    
    if (!clickedNode) return;
    
    // Check if this is the first click (start path) or a valid neighbor
    if (userPath.length === 0) {
        // Must start at start node
        if (clickedNode.id === raceGraphData.startNode) {
            userPath = [clickedNode.id];
            calculateUserPathCostsForRace();
            renderRaceUser();
            updateRaceUserStats();
        }
    } else {
        const currentNode = userPath[userPath.length - 1];
        const currentNodeObj = raceGraphData.nodes[currentNode];
        
        // Check if clicked node is a neighbor
        const isNeighbor = currentNodeObj.neighbors.some(n => n.id === clickedNode.id);
        
        if (isNeighbor) {
            // Check if going back (clicked the previous node)
            if (userPath.length > 1 && userPath[userPath.length - 2] === clickedNode.id) {
                userPath.pop();
            } else if (!userPath.includes(clickedNode.id)) {
                // Add new node to path
                userPath.push(clickedNode.id);
            }
            
            calculateUserPathCostsForRace();
            renderRaceUser();
            updateRaceUserStats();
            
            // Check if user reached end
            if (clickedNode.id === raceGraphData.endNode && !raceUserComplete) {
                raceUserComplete = true;
                raceUserFinalTime = ((Date.now() - raceStartTime) / 1000).toFixed(1);
                checkRaceResult();
            }
        }
    }
}

/**
 * Calculate user path costs for race mode
 */
function calculateUserPathCostsForRace() {
    userPathCosts = {};
    if (!raceGraphData || userPath.length === 0) return;
    
    let cumulative = 0;
    userPathCosts[userPath[0]] = 0;
    
    for (let i = 1; i < userPath.length; i++) {
        const prevNode = raceGraphData.nodes[userPath[i - 1]];
        const edge = prevNode.neighbors.find(n => n.id === userPath[i]);
        if (edge) {
            cumulative += edge.weight;
        }
        userPathCosts[userPath[i]] = cumulative;
    }
}

/**
 * Update race user stats display
 */
function updateRaceUserStats() {
    if (!raceGraphData || userPath.length === 0) return;
    
    const distance = calculatePathWeight(userPath, raceGraphData.nodes);
    // Use stored final time if user has completed, otherwise show current elapsed time
    const time = raceUserComplete && raceUserFinalTime 
        ? raceUserFinalTime 
        : (raceStartTime ? ((Date.now() - raceStartTime) / 1000).toFixed(1) : '0.0');
    
    if (raceUserDistEl) raceUserDistEl.textContent = distance;
    if (raceUserTimeEl) raceUserTimeEl.textContent = time + 's';
}

/**
 * Render race user canvas
 */
function renderRaceUser() {
    if (!raceUserRenderer) return;
    
    if (!raceStarted || !raceGraphData) {
        raceUserRenderer.clear();
        return;
    }
    
    // Get clickable nodes for race mode
    const clickableNodes = getClickableNodes(raceGraphData, userPath);
    raceUserRenderer.draw(raceGraphData, userPath, [], [], [], userPathCosts, {}, clickableNodes);
}

/**
 * Handle canvas click events
 */
function handleCanvasClick(e) {
    if (isAnimating || !graphData) return;
    
    // Only handle clicks in explore tab
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

// toggleRaceMode removed - now handled by switchTab

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
 * Start race from button click - always starts a new race directly
 */
function startRaceFromButton() {
    if (activeTab !== 'race') return;
    
    // If race is in progress (not complete), ignore
    if (raceStarted && !raceAlgoComplete) return;
    
    // Reset state if previous race exists
    if (raceStarted) {
        raceStarted = false;
        raceGraphData = null;
        raceStartTime = null;
        raceAlgoComplete = false;
        raceAlgoDistance = null;
        raceAlgoTime = null;
        raceUserComplete = false;
        raceUserFinalTime = null;
        raceAnimationHighlight = null;
        raceAnimationVisited = [];
        raceAnimationDistances = {};
        raceFinalDistances = {};
        userPath = [];
        userPathCosts = {};
        
        // Reset UI stats
        if (raceUserDistEl) raceUserDistEl.textContent = '0';
        if (raceUserTimeEl) raceUserTimeEl.textContent = '0.0s';
        if (raceAlgoDistEl) raceAlgoDistEl.textContent = '?';
        if (raceAlgoTimeEl) raceAlgoTimeEl.textContent = '?';
        if (raceResultSection) raceResultSection.style.display = 'none';
    }
    
    // Disable start button
    if (startRaceBtn) {
        startRaceBtn.disabled = true;
        startRaceBtn.textContent = 'Racing...';
    }
    
    // Generate new graph and start race
    generateRaceGraph();
}

/**
 * Generate new graph for race mode
 */
function generateRaceGraph() {
    if (activeTab !== 'race') return;
    
    // Generate new graph using race canvas dimensions
    const canvasWidth = raceUserCanvas ? raceUserCanvas.width : 800;
    const canvasHeight = raceUserCanvas ? raceUserCanvas.height : 500;
    
    raceGraphData = generateGraph({
        nodeCount: DEFAULT_NODE_COUNT,
        connectivityRadius: DEFAULT_CONNECTIVITY_RADIUS,
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight
    });
    
    // Reset user path
    userPath = [raceGraphData.startNode];
    userPathCosts = {};
    calculateUserPathCostsForRace();
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
    if (activeTab !== 'race' || !raceGraphData || !raceStarted) return;

    raceStartTime = Date.now();
    raceAlgoComplete = false;
    raceAlgoDistance = null;
    raceAlgoTime = null;
    raceAnimationHighlight = null;
    raceAnimationVisited = [];
    raceAnimationDistances = {};
    raceFinalDistances = {};

    // Reset race UI
    if (raceUserDistEl) raceUserDistEl.textContent = '0';
    if (raceUserTimeEl) raceUserTimeEl.textContent = '0.0s';
    if (raceAlgoDistEl) raceAlgoDistEl.textContent = '?';
    if (raceAlgoTimeEl) raceAlgoTimeEl.textContent = '?';

    // Render both canvases with new graph
    renderRaceUser();
    renderRace();

    // Get speed based on difficulty
    const speed = RACE_SPEEDS[raceDifficulty] || RACE_SPEEDS.medium;

    // Run selected algorithm on race canvas with visualization
    const onStep = (currentNode, visited, distances) => {
        raceAnimationHighlight = currentNode;
        raceAnimationVisited = visited;
        raceAnimationDistances = distances;
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
        renderRace(result.path);
        
        // Check if user has completed their path and show result
        checkRaceResult();
    };

    // Get the algorithm function based on selection
    const algoFunction = getAlgorithmFunction(raceAlgorithm);
    
    await algoFunction(
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
    
    const userDistance = calculatePathWeight(userPath, raceGraphData.nodes);
    
    // Only update UI if user has completed path
    if (raceUserComplete && raceUserFinalTime) {
        if (raceUserDistEl) raceUserDistEl.textContent = userDistance;
        if (raceUserTimeEl) raceUserTimeEl.textContent = raceUserFinalTime + 's';
    }
    
    // Only show result if user has completed path
    if (raceUserComplete && userPath.length > 0 && userPath[userPath.length - 1] === raceGraphData.endNode) {
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
        
        // Update button to "Start New Race"
        if (startRaceBtn) {
            startRaceBtn.disabled = false;
            startRaceBtn.textContent = 'Start New Race';
        }
    }
}

// startNewRace removed - now using resetRaceState

/**
 * Render race algorithm canvas with animation state
 */
function renderRace(optimalPath = null) {
    if (activeTab !== 'race' || !raceRenderer) return;
    
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
 * Generate a new graph (for Explore tab)
 */
function generateNewGraph() {
    // Only generate graph for explore tab
    if (activeTab !== 'explore') {
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
 * Update UI elements (for Explore tab)
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
 * Get clickable nodes (neighbors of current node that aren't already in path)
 * @param {Object} data - Graph data
 * @param {Array} path - Current user path
 * @returns {Array} - Array of clickable node IDs
 */
function getClickableNodes(data, path) {
    if (!data || path.length === 0) return [];
    
    const currentNodeId = path[path.length - 1];
    const currentNode = data.nodes[currentNodeId];
    
    if (!currentNode) return [];
    
    // Get all neighbors that aren't already in the path (except allow going back one step)
    const clickable = currentNode.neighbors
        .map(n => n.id)
        .filter(id => {
            // Allow clicking the previous node (to go back)
            if (path.length > 1 && id === path[path.length - 2]) return true;
            // Don't allow clicking nodes already in path
            return !path.includes(id);
        });
    
    return clickable;
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
 * Render the graph (for Explore tab)
 */
function render() {
    if (!renderer) return;
    
    // If no graph data, clear canvas
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

    // Get clickable nodes (neighbors of current node, not already in path)
    const clickableNodes = getClickableNodes(graphData, userPath);

    renderer.draw(
        graphData,
        userPath,
        highlightNodes,
        visitedNodes,
        pathToShow,
        userPathCosts,
        distances,
        clickableNodes
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

// toggleAlgorithmRaceMode removed - now handled by switchTab

/**
 * Get algorithm display name
 */
function getAlgorithmName(algoKey) {
    const names = {
        'dijkstra': 'Dijkstra',
        'astar': 'A*',
        'bfs': 'BFS',
        'dfs': 'DFS'
    };
    return names[algoKey] || algoKey;
}

/**
 * Start algorithm race from button - always starts directly
 */
function startAlgorithmRaceFromButton() {
    if (activeTab !== 'compare') return;
    
    // If race is in progress (not complete), ignore
    const allComplete = Object.values(algoResults).every(state => state.complete);
    if (algoRaceStarted && !allComplete) return;
    
    // Reset state if previous race exists
    if (algoRaceStarted) {
        algoRaceStarted = false;
        algoRaceGraphData = null;
        Object.keys(algoResults).forEach(key => {
            algoResults[key] = {
                result: null,
                startTime: null,
                complete: false,
                highlight: null,
                visited: [],
                distances: {},
                finalDistances: {}
            };
        });
        
        // Reset UI stats
        const algoNames = ['Dijkstra', 'Astar', 'Bfs', 'Dfs'];
        algoNames.forEach(name => {
            const distEl = document.getElementById(`algo${name}Dist`);
            const timeEl = document.getElementById(`algo${name}Time`);
            if (distEl) distEl.textContent = '?';
            if (timeEl) timeEl.textContent = '?';
        });
        if (algoRaceResultSection) algoRaceResultSection.style.display = 'none';
    }
    
    // Disable start button
    if (startAlgoRaceBtn) {
        startAlgoRaceBtn.disabled = true;
        startAlgoRaceBtn.textContent = 'Racing...';
    }
    
    // Generate new graph and start race
    generateAlgorithmRaceGraph();
}

/**
 * Generate graph for algorithm race
 */
function generateAlgorithmRaceGraph() {
    if (activeTab !== 'compare') return;
    
    // Show loading message
    if (statusMsgEl) {
        statusMsgEl.innerText = "Generating algorithm race graph...";
        statusMsgEl.style.color = "#aaa";
    }

    // Generate new graph
    const algoDijkstraCanvas = document.getElementById('algoDijkstraCanvas');
    algoRaceGraphData = generateGraph({
        nodeCount: DEFAULT_NODE_COUNT,
        connectivityRadius: DEFAULT_CONNECTIVITY_RADIUS,
        canvasWidth: algoDijkstraCanvas ? algoDijkstraCanvas.width : 400,
        canvasHeight: algoDijkstraCanvas ? algoDijkstraCanvas.height : 300
    });

    // Start the race
    algoRaceStarted = true;
    startAlgorithmRace();
}

/**
 * Start algorithm race
 */
async function startAlgorithmRace() {
    if (activeTab !== 'compare' || !algoRaceGraphData || !algoRaceStarted) return;

    // Reset state for all algorithms
    Object.keys(algoResults).forEach(key => {
        algoResults[key] = {
            result: null,
            startTime: null,
            complete: false,
            highlight: null,
            visited: [],
            distances: {},
            finalDistances: {}
        };
    });

    // Reset UI
    const algoNames = ['Dijkstra', 'Astar', 'Bfs', 'Dfs'];
    algoNames.forEach(name => {
        const distEl = document.getElementById(`algo${name}Dist`);
        const timeEl = document.getElementById(`algo${name}Time`);
        if (distEl) distEl.textContent = '?';
        if (timeEl) timeEl.textContent = '?';
    });

    // Render all canvases with new graph
    renderAlgorithmRace();

    // Run all 6 algorithms simultaneously
    await runAllAlgorithmsRace();
}

/**
 * Run all 6 algorithms simultaneously
 */
async function runAllAlgorithmsRace() {
    const algorithms = ['dijkstra', 'astar', 'bfs', 'dfs'];
    const promises = algorithms.map(algoName => runAlgorithm(algoName));
    
    await Promise.all(promises);
    
    checkAlgorithmRaceResult();
}

/**
 * Run a single algorithm
 */
async function runAlgorithm(algoName) {
    const startTime = Date.now();
    const algoState = algoResults[algoName];
    algoState.startTime = startTime;

    const onStep = (currentNode, visited, distances) => {
        algoState.highlight = currentNode;
        algoState.visited = visited;
        algoState.distances = distances;
        renderAlgorithmRace();
    };

    const onComplete = (algoResult) => {
        const endTime = Date.now();
        const time = ((endTime - startTime) / 1000).toFixed(1);
        
        algoState.result = algoResult;
        algoState.complete = true;
        algoState.finalDistances = algoState.distances;
        algoState.highlight = null;
        algoState.visited = [];
        
        // Update UI
        const nameMap = {
            'dijkstra': 'Dijkstra',
            'astar': 'Astar',
            'bfs': 'Bfs',
            'dfs': 'Dfs'
        };
        const displayName = nameMap[algoName];
        const distEl = document.getElementById(`algo${displayName}Dist`);
        const timeEl = document.getElementById(`algo${displayName}Time`);
        if (distEl) distEl.textContent = algoResult.distance || '?';
        if (timeEl) timeEl.textContent = time + 's';
        
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
        'dfs': dfsAnimated
    };
    return algorithms[algoName] || dijkstraAnimated;
}

/**
 * Check algorithm race result and display winner
 */
function checkAlgorithmRaceResult() {
    // Check if all algorithms are complete
    const allComplete = Object.values(algoResults).every(state => state.complete);
    if (!allComplete) return;
    
    if (algoRaceResultSection) {
        algoRaceResultSection.style.display = 'block';
    }
    
    // Find winner(s) - algorithm(s) with lowest distance
    let bestDistance = Infinity;
    let winners = [];
    
    Object.entries(algoResults).forEach(([name, state]) => {
        if (state.result && state.result.distance !== null) {
            if (state.result.distance < bestDistance) {
                bestDistance = state.result.distance;
                winners = [name];
            } else if (state.result.distance === bestDistance) {
                winners.push(name);
            }
        }
    });
    
    if (winners.length === 0) {
        if (algoRaceResultTitleEl) algoRaceResultTitleEl.textContent = 'No Winner';
        if (algoRaceResultMessageEl) {
            algoRaceResultMessageEl.textContent = 'No algorithm found a path.';
        }
    } else if (winners.length === 1) {
        const winnerName = getAlgorithmName(winners[0]);
        if (algoRaceResultTitleEl) algoRaceResultTitleEl.textContent = winnerName + ' Won!';
        if (algoRaceResultMessageEl) {
            algoRaceResultMessageEl.textContent = `${winnerName} found the shortest path (${bestDistance}).`;
        }
    } else {
        const winnerNames = winners.map(w => getAlgorithmName(w)).join(', ');
        if (algoRaceResultTitleEl) algoRaceResultTitleEl.textContent = 'Tie!';
        if (algoRaceResultMessageEl) {
            algoRaceResultMessageEl.textContent = `${winnerNames} tied with optimal path (${bestDistance}).`;
        }
    }
    
    // Update button to "Start New Race"
    if (startAlgoRaceBtn) {
        startAlgoRaceBtn.disabled = false;
        startAlgoRaceBtn.textContent = 'Start New Race';
    }
}

/**
 * Start a new algorithm race
 */
function startNewAlgorithmRace() {
    if (activeTab !== 'compare') return;
    
    // Hide result
    if (algoRaceResultSection) {
        algoRaceResultSection.style.display = 'none';
    }
    
    // Reset race state
    algoRaceStarted = false;
    algoRaceGraphData = null;
    Object.keys(algoResults).forEach(key => {
        algoResults[key] = {
            result: null,
            startTime: null,
            complete: false,
            highlight: null,
            visited: [],
            distances: {},
            finalDistances: {}
        };
    });
    
    // Reset UI
    const algoNames = ['Dijkstra', 'Astar', 'Bfs', 'Dfs'];
    algoNames.forEach(name => {
        const distEl = document.getElementById(`algo${name}Dist`);
        const timeEl = document.getElementById(`algo${name}Time`);
        if (distEl) distEl.textContent = '?';
        if (timeEl) timeEl.textContent = '?';
    });
    if (startAlgoRaceBtn) {
        startAlgoRaceBtn.disabled = false;
        startAlgoRaceBtn.textContent = 'Start New Race';
    }
    if (statusMsgEl) {
        statusMsgEl.innerText = 'Click Start New Race to see all algorithms compete';
        statusMsgEl.style.color = '#aaa';
    }
    
    // Show black canvases
    renderAlgorithmRace();
}

/**
 * Render algorithm race canvases
 */
function renderAlgorithmRace() {
    if (activeTab !== 'compare') return;
    
    const renderers = {
        'dijkstra': algoDijkstraRenderer,
        'astar': algoAstarRenderer,
        'bfs': algoBfsRenderer,
        'dfs': algoDfsRenderer
    };
    
    // If race hasn't started, show black canvases
    if (!algoRaceStarted || !algoRaceGraphData) {
        Object.values(renderers).forEach(renderer => {
            if (renderer) renderer.clear();
        });
        return;
    }
    
    // Render each algorithm canvas
    Object.entries(renderers).forEach(([algoName, renderer]) => {
        if (!renderer) return;
        
        const algoState = algoResults[algoName];
        
        if (algoState.complete && algoState.result && algoState.result.path) {
            const distancesToShow = Object.keys(algoState.finalDistances).length > 0 
                ? algoState.finalDistances 
                : algoState.distances;
            renderer.draw(algoRaceGraphData, [], [], [], algoState.result.path, {}, distancesToShow);
        } else {
            const highlightNodes = algoState.highlight !== null ? [algoState.highlight] : [];
            renderer.draw(algoRaceGraphData, [], highlightNodes, algoState.visited, [], {}, algoState.distances);
        }
    });
}

/**
 * Run 100 race simulations and display statistics
 */
async function runSimulation() {
    if (activeTab !== 'compare') return;
    
    const simulateBtn = document.getElementById('simulateBtn');
    const simStats = document.getElementById('simulationStats');
    const simProgress = document.getElementById('simProgress');
    const simTableBody = document.getElementById('simTableBody');
    
    if (!simStats || !simProgress || !simTableBody) return;
    
    // Disable button during simulation
    if (simulateBtn) {
        simulateBtn.disabled = true;
        simulateBtn.textContent = 'Simulating...';
    }
    
    // Show stats section
    simStats.style.display = 'block';
    simProgress.textContent = 'Running simulations: 0/100';
    simTableBody.innerHTML = '';
    
    // Algorithm configurations
    const algorithms = [
        { name: 'Dijkstra', key: 'dijkstra', fn: dijkstra },
        { name: 'A*', key: 'astar', fn: aStar },
        { name: 'BFS', key: 'bfs', fn: bfs },
        { name: 'DFS', key: 'dfs', fn: dfs }
    ];
    
    // Statistics storage
    const stats = {};
    algorithms.forEach(algo => {
        stats[algo.key] = {
            name: algo.name,
            optimalCount: 0,
            totalTime: 0,
            totalNodes: 0,
            runs: 0
        };
    });
    
    const NUM_SIMULATIONS = 100;
    
    // Run simulations
    for (let i = 0; i < NUM_SIMULATIONS; i++) {
        // Generate a new graph for this simulation
        const simGraph = generateGraph({
            nodeCount: DEFAULT_NODE_COUNT,
            connectivityRadius: DEFAULT_CONNECTIVITY_RADIUS,
            canvasWidth: 400,
            canvasHeight: 300
        });
        
        // Run Dijkstra first to get optimal distance
        const dijkstraResult = dijkstra(simGraph.nodes, simGraph.startNode, simGraph.endNode);
        const optimalDistance = dijkstraResult.distance;
        
        // Run all algorithms and collect stats
        for (const algo of algorithms) {
            const startTime = performance.now();
            const result = algo.fn(simGraph.nodes, simGraph.startNode, simGraph.endNode);
            const endTime = performance.now();
            
            stats[algo.key].runs++;
            stats[algo.key].totalTime += (endTime - startTime);
            stats[algo.key].totalNodes += result.visitedNodes ? result.visitedNodes.length : 0;
            
            // Check if found optimal path
            if (result.distance !== null && result.distance === optimalDistance) {
                stats[algo.key].optimalCount++;
            }
        }
        
        // Update progress every 10 simulations
        if ((i + 1) % 10 === 0 || i === NUM_SIMULATIONS - 1) {
            simProgress.textContent = `Running simulations: ${i + 1}/${NUM_SIMULATIONS}`;
            // Allow UI to update
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
    
    // Calculate and display results
    simProgress.textContent = 'Simulation complete!';
    
    // Find most efficient algorithm (fewest nodes - this is "visual speed")
    let fewestNodes = Infinity;
    Object.values(stats).forEach(s => {
        const avgNodes = s.totalNodes / s.runs;
        if (avgNodes < fewestNodes) fewestNodes = avgNodes;
    });
    
    // Build results table
    let tableHTML = '';
    algorithms.forEach(algo => {
        const s = stats[algo.key];
        const accuracy = ((s.optimalCount / s.runs) * 100).toFixed(1);
        const avgTime = (s.totalTime / s.runs).toFixed(3);
        const avgNodes = (s.totalNodes / s.runs).toFixed(1);
        const isMostEfficient = Math.abs((s.totalNodes / s.runs) - fewestNodes) < 0.1;
        
        // Determine accuracy class
        let accuracyClass = 'accuracy-poor';
        if (accuracy >= 100) accuracyClass = 'accuracy-optimal';
        else if (accuracy >= 90) accuracyClass = 'accuracy-good';
        else if (accuracy >= 70) accuracyClass = 'accuracy-medium';
        
        tableHTML += `
            <tr>
                <td>${s.name}</td>
                <td class="${accuracyClass}">${accuracy}%</td>
                <td>${avgTime}ms</td>
                <td class="${isMostEfficient ? 'fastest' : ''}">${avgNodes}</td>
            </tr>
        `;
    });
    
    simTableBody.innerHTML = tableHTML;
    
    // Re-enable button
    if (simulateBtn) {
        simulateBtn.disabled = false;
        simulateBtn.textContent = 'Simulate 100 Races';
    }
}
