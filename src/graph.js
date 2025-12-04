/**
 * graph.js
 * Handles graph generation, node creation, and edge connectivity logic
 */

// Configuration constants
export const DEFAULT_NODE_COUNT = 15;
export const DEFAULT_CONNECTIVITY_RADIUS = 180; // Reduced to avoid too many edges
export const WEIGHT_DIVISOR = 40; // Divide distance by this to get weight (adjusted for single digits)
export const MIN_START_END_DISTANCE_PERCENT = 0.3; // 30% of canvas diagonal
export const MIN_NODE_DISTANCE = 60; // Minimum distance between nodes in pixels
export const MAX_EDGES_PER_NODE = 5; // Maximum number of edges per node to reduce complexity

/**
 * Convert numeric ID to letter label (0→A, 1→B, ... 25→Z, 26→AA, 27→AB, etc.)
 * @param {number} id - Numeric ID
 * @returns {string} Letter label
 */
export function idToLetter(id) {
    if (id < 26) {
        return String.fromCharCode(65 + id); // A-Z
    } else {
        const firstLetter = String.fromCharCode(65 + Math.floor((id - 26) / 26));
        const secondLetter = String.fromCharCode(65 + ((id - 26) % 26));
        return firstLetter + secondLetter; // AA-ZZ
    }
}

/**
 * Node class representing a vertex in the graph
 */
export class Node {
    constructor(id, x, y) {
        this.id = id; // Numeric ID (for internal use)
        this.label = idToLetter(id); // Letter label (for display)
        this.x = x;
        this.y = y;
        this.neighbors = []; // Array of {id, weight} objects
    }

    /**
     * Add a neighbor connection
     * @param {number} neighborId - The ID of the neighboring node
     * @param {number} weight - The weight/cost of the edge
     */
    addNeighbor(neighborId, weight) {
        this.neighbors.push({ id: neighborId, weight });
    }
}

/**
 * Calculate Euclidean distance between two nodes
 * @param {Node} node1 - First node
 * @param {Node} node2 - Second node
 * @returns {number} Euclidean distance in pixels
 */
export function calculateDistance(node1, node2) {
    return Math.hypot(node1.x - node2.x, node1.y - node2.y);
}

/**
 * Calculate edge weight from distance (clamped to single digits 1-9)
 * @param {number} distance - Euclidean distance in pixels
 * @returns {number} Edge weight (1-9)
 */
export function calculateWeight(distance) {
    const weight = Math.floor(distance / WEIGHT_DIVISOR);
    return Math.min(9, Math.max(1, weight)); // Clamp between 1 and 9
}

/**
 * Check if a position is too close to existing nodes
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Node[]} existingNodes - Array of existing nodes
 * @param {number} minDistance - Minimum distance required
 * @returns {boolean} True if position is valid (not too close)
 */
function isValidNodePosition(x, y, existingNodes, minDistance) {
    for (const node of existingNodes) {
        const distance = Math.hypot(x - node.x, y - node.y);
        if (distance < minDistance) {
            return false;
        }
    }
    return true;
}

/**
 * Generate random nodes within canvas bounds with minimum spacing
 * @param {number} count - Number of nodes to generate
 * @param {number} canvasWidth - Width of the canvas
 * @param {number} canvasHeight - Height of the canvas
 * @param {number} padding - Padding from edges (default: 50)
 * @param {number} minDistance - Minimum distance between nodes (default: MIN_NODE_DISTANCE)
 * @returns {Node[]} Array of generated nodes
 */
export function generateNodes(count, canvasWidth, canvasHeight, padding = 50, minDistance = MIN_NODE_DISTANCE) {
    const nodes = [];
    const maxAttempts = 1000; // Maximum attempts to place each node
    
    for (let i = 0; i < count; i++) {
        let x, y;
        let attempts = 0;
        let validPosition = false;
        
        // Try to find a valid position that's not too close to existing nodes
        while (!validPosition && attempts < maxAttempts) {
            x = padding + Math.random() * (canvasWidth - 2 * padding);
            y = padding + Math.random() * (canvasHeight - 2 * padding);
            
            if (isValidNodePosition(x, y, nodes, minDistance)) {
                validPosition = true;
            }
            attempts++;
        }
        
        // If we couldn't find a valid position after many attempts, use the last generated position
        // This prevents infinite loops when canvas is too small for the node count
        nodes.push(new Node(i, x, y));
    }
    
    return nodes;
}

/**
 * Connect nodes based on proximity (within connectivity radius)
 * Limits edges per node to reduce complexity
 * @param {Node[]} nodes - Array of nodes to connect
 * @param {number} connectivityRadius - Maximum distance for edge creation
 * @param {number} maxEdgesPerNode - Maximum edges per node (default: MAX_EDGES_PER_NODE)
 * @returns {Array} Array of edge objects {from, to, weight}
 */
export function connectNodesByProximity(nodes, connectivityRadius, maxEdgesPerNode = MAX_EDGES_PER_NODE) {
    const edges = [];
    const edgeCounts = new Array(nodes.length).fill(0); // Track edges per node

    // Collect all potential edges with their distances
    const potentialEdges = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const distance = calculateDistance(nodes[i], nodes[j]);
            
            if (distance < connectivityRadius) {
                potentialEdges.push({
                    from: i,
                    to: j,
                    distance,
                    weight: calculateWeight(distance)
                });
            }
        }
    }

    // Sort edges by distance (shorter edges first - prefer closer connections)
    potentialEdges.sort((a, b) => a.distance - b.distance);

    // Add edges while respecting the max edges per node limit
    for (const edge of potentialEdges) {
        // Check if both nodes can accept more edges
        if (edgeCounts[edge.from] < maxEdgesPerNode && edgeCounts[edge.to] < maxEdgesPerNode) {
            edges.push({ from: edge.from, to: edge.to, weight: edge.weight });
            nodes[edge.from].addNeighbor(edge.to, edge.weight);
            nodes[edge.to].addNeighbor(edge.from, edge.weight);
            edgeCounts[edge.from]++;
            edgeCounts[edge.to]++;
        }
    }

    return edges;
}

/**
 * Check if graph is connected using BFS
 * @param {Node[]} nodes - Array of nodes
 * @returns {boolean} True if graph is connected
 */
export function isGraphConnected(nodes) {
    if (nodes.length === 0) return false;
    if (nodes.length === 1) return true;

    const visited = new Set();
    const queue = [0]; // Start BFS from first node
    visited.add(0);

    while (queue.length > 0) {
        const currentId = queue.shift();
        const currentNode = nodes[currentId];

        for (const neighbor of currentNode.neighbors) {
            if (!visited.has(neighbor.id)) {
                visited.add(neighbor.id);
                queue.push(neighbor.id);
            }
        }
    }

    // Graph is connected if we visited all nodes
    return visited.size === nodes.length;
}

/**
 * Ensure graph connectivity by adding edges if needed
 * Respects max edges per node limit
 * @param {Node[]} nodes - Array of nodes
 * @param {Array} edges - Array of existing edges
 * @param {number} maxEdgesPerNode - Maximum edges per node (default: MAX_EDGES_PER_NODE)
 * @returns {Array} Updated array of edges
 */
export function ensureConnectivity(nodes, edges, maxEdgesPerNode = MAX_EDGES_PER_NODE) {
    if (nodes.length < 2) return edges;

    // Check if already connected
    if (isGraphConnected(nodes)) {
        return edges;
    }

    // Count current edges per node
    const edgeCounts = new Array(nodes.length).fill(0);
    for (const edge of edges) {
        edgeCounts[edge.from]++;
        edgeCounts[edge.to]++;
    }

    // Find connected components using BFS
    const components = [];
    const visited = new Set();

    for (let i = 0; i < nodes.length; i++) {
        if (visited.has(i)) continue;

        // Start new component
        const component = [];
        const queue = [i];
        visited.add(i);
        component.push(i);

        while (queue.length > 0) {
            const currentId = queue.shift();
            const currentNode = nodes[currentId];

            for (const neighbor of currentNode.neighbors) {
                if (!visited.has(neighbor.id)) {
                    visited.add(neighbor.id);
                    component.push(neighbor.id);
                    queue.push(neighbor.id);
                }
            }
        }

        components.push(component);
    }

    // Connect components by adding edges between closest nodes
    // Only if nodes haven't exceeded their edge limit
    for (let i = 0; i < components.length - 1; i++) {
        const comp1 = components[i];
        const comp2 = components[i + 1];

        // Find closest pair of nodes between components that can accept more edges
        let minDist = Infinity;
        let node1Id = null;
        let node2Id = null;

        for (const id1 of comp1) {
            if (edgeCounts[id1] >= maxEdgesPerNode) continue;
            
            for (const id2 of comp2) {
                if (edgeCounts[id2] >= maxEdgesPerNode) continue;
                
                const dist = calculateDistance(nodes[id1], nodes[id2]);
                if (dist < minDist) {
                    minDist = dist;
                    node1Id = id1;
                    node2Id = id2;
                }
            }
        }

        // Add edge between closest nodes (if found)
        if (node1Id !== null && node2Id !== null) {
            const weight = calculateWeight(minDist);
            edges.push({ from: node1Id, to: node2Id, weight });
            nodes[node1Id].addNeighbor(node2Id, weight);
            nodes[node2Id].addNeighbor(node1Id, weight);
            edgeCounts[node1Id]++;
            edgeCounts[node2Id]++;
        }
    }

    return edges;
}

/**
 * Select start and end nodes ensuring minimum distance between them
 * @param {Node[]} nodes - Array of nodes to choose from
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} minDistancePercent - Minimum distance as percentage of diagonal (default: 0.3)
 * @returns {Object} Object with startNode and endNode IDs
 */
export function selectStartAndEndNodes(nodes, canvasWidth, canvasHeight, minDistancePercent = MIN_START_END_DISTANCE_PERCENT) {
    if (nodes.length < 2) {
        return { startNode: 0, endNode: 0 };
    }

    // Calculate minimum distance (30% of canvas diagonal)
    const canvasDiagonal = Math.hypot(canvasWidth, canvasHeight);
    const minDistance = canvasDiagonal * minDistancePercent;

    let startNode = 0;
    let endNode = 0;
    let attempts = 0;
    const maxAttempts = 100;

    // Keep selecting until we find nodes that meet distance requirement
    while (attempts < maxAttempts) {
        startNode = Math.floor(Math.random() * nodes.length);
        endNode = Math.floor(Math.random() * nodes.length);

        if (startNode !== endNode) {
            const distance = calculateDistance(nodes[startNode], nodes[endNode]);
            if (distance >= minDistance) {
                return { startNode, endNode };
            }
        }
        attempts++;
    }

    // If we couldn't find suitable pair, just ensure they're different
    while (endNode === startNode) {
        startNode = Math.floor(Math.random() * nodes.length);
        endNode = Math.floor(Math.random() * nodes.length);
    }

    return { startNode, endNode };
}

/**
 * Generate a complete graph with nodes and edges
 * @param {Object} config - Configuration object
 * @param {number} config.nodeCount - Number of nodes to generate
 * @param {number} config.connectivityRadius - Maximum distance for edge creation
 * @param {number} config.canvasWidth - Width of the canvas
 * @param {number} config.canvasHeight - Height of the canvas
 * @returns {Object} Graph object containing nodes, edges, startNode, and endNode
 */
export function generateGraph(config = {}) {
    const {
        nodeCount = DEFAULT_NODE_COUNT,
        connectivityRadius = DEFAULT_CONNECTIVITY_RADIUS,
        canvasWidth = 800,
        canvasHeight = 500
    } = config;

    // Ensure at least 2 nodes
    const actualNodeCount = Math.max(2, nodeCount);

    let nodes;
    let edges;
    let attempts = 0;
    const maxAttempts = 10;

    // Try to generate a connected graph
    do {
        // Generate nodes with minimum spacing
        nodes = generateNodes(actualNodeCount, canvasWidth, canvasHeight);

        // Connect nodes based on proximity (with edge limit)
        edges = connectNodesByProximity(nodes, connectivityRadius, MAX_EDGES_PER_NODE);

        // Ensure connectivity (respecting edge limits)
        edges = ensureConnectivity(nodes, edges, MAX_EDGES_PER_NODE);

        attempts++;
    } while (!isGraphConnected(nodes) && attempts < maxAttempts);

    // If still not connected after max attempts, increase connectivity radius and try once more
    if (!isGraphConnected(nodes) && attempts >= maxAttempts) {
        const increasedRadius = connectivityRadius * 1.5;
        // Temporarily allow more edges to ensure connectivity
        const tempMaxEdges = MAX_EDGES_PER_NODE + 2;
        edges = connectNodesByProximity(nodes, increasedRadius, tempMaxEdges);
        edges = ensureConnectivity(nodes, edges, tempMaxEdges);
    }

    // Select start and end nodes with minimum distance requirement
    const { startNode, endNode } = selectStartAndEndNodes(nodes, canvasWidth, canvasHeight);

    return {
        nodes,
        edges,
        startNode,
        endNode
    };
}

