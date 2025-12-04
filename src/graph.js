/**
 * graph.js
 * Handles graph generation, node creation, and edge connectivity logic
 */

// Configuration constants
export const DEFAULT_NODE_COUNT = 15;
export const DEFAULT_CONNECTIVITY_RADIUS = 200;
export const WEIGHT_DIVISOR = 10; // Divide distance by this to get weight

/**
 * Node class representing a vertex in the graph
 */
export class Node {
    constructor(id, x, y) {
        this.id = id;
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
 * Calculate edge weight from distance
 * @param {number} distance - Euclidean distance in pixels
 * @returns {number} Edge weight (distance / WEIGHT_DIVISOR, floored)
 */
export function calculateWeight(distance) {
    return Math.floor(distance / WEIGHT_DIVISOR);
}

/**
 * Generate random nodes within canvas bounds
 * @param {number} count - Number of nodes to generate
 * @param {number} canvasWidth - Width of the canvas
 * @param {number} canvasHeight - Height of the canvas
 * @param {number} padding - Padding from edges (default: 50)
 * @returns {Node[]} Array of generated nodes
 */
export function generateNodes(count, canvasWidth, canvasHeight, padding = 50) {
    const nodes = [];
    for (let i = 0; i < count; i++) {
        const x = padding + Math.random() * (canvasWidth - 2 * padding);
        const y = padding + Math.random() * (canvasHeight - 2 * padding);
        nodes.push(new Node(i, x, y));
    }
    return nodes;
}

/**
 * Connect nodes based on proximity (within connectivity radius)
 * @param {Node[]} nodes - Array of nodes to connect
 * @param {number} connectivityRadius - Maximum distance for edge creation
 * @returns {Array} Array of edge objects {from, to, weight}
 */
export function connectNodesByProximity(nodes, connectivityRadius) {
    const edges = [];

    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const distance = calculateDistance(nodes[i], nodes[j]);
            
            if (distance < connectivityRadius) {
                const weight = calculateWeight(distance);
                
                // Create bidirectional edge
                edges.push({ from: i, to: j, weight });
                nodes[i].addNeighbor(j, weight);
                nodes[j].addNeighbor(i, weight);
            }
        }
    }

    return edges;
}

/**
 * Select start and end nodes ensuring they are different
 * @param {Node[]} nodes - Array of nodes to choose from
 * @returns {Object} Object with startNode and endNode IDs
 */
export function selectStartAndEndNodes(nodes) {
    let startNode = 0;
    let endNode = 0;
    
    // Ensure start and end are different
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

    // Generate nodes
    const nodes = generateNodes(nodeCount, canvasWidth, canvasHeight);

    // Connect nodes based on proximity
    const edges = connectNodesByProximity(nodes, connectivityRadius);

    // Select start and end nodes
    const { startNode, endNode } = selectStartAndEndNodes(nodes);

    return {
        nodes,
        edges,
        startNode,
        endNode
    };
}

