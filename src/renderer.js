/**
 * renderer.js
 * Handles all canvas drawing operations for the graph visualization
 */

// Color constants
export const COLORS = {
    BACKGROUND: '#111',
    EDGE_DEFAULT: '#444',
    EDGE_WEIGHT_TEXT: '#888',
    NODE_DEFAULT: '#777',
    NODE_VISITED: '#554400',      // Visited by algorithm
    NODE_HIGHLIGHT: '#FFD700',    // Active algorithm node
    NODE_USER_PATH: '#2196F3',    // User path (Blue)
    NODE_OPTIMAL_PATH: '#00FFFF', // Optimal path (Cyan)
    NODE_START: '#4CAF50',        // Start (Green)
    NODE_END: '#F44336',          // End (Red)
    NODE_STROKE: '#fff',
    TEXT: '#fff'
};

// Drawing constants
export const NODE_RADIUS = 15;
export const NODE_STROKE_WIDTH = 1;
export const EDGE_WIDTH = 2;
export const USER_PATH_WIDTH = 5;
export const OPTIMAL_PATH_WIDTH = 4;
export const NODE_CLICK_RADIUS = 20;
export const FONT_SIZE = 12;
export const FONT_FAMILY = 'Arial';

/**
 * Renderer class for managing canvas drawing operations
 */
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    /**
     * Clear the entire canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw an edge between two nodes
     * @param {Node} node1 - First node
     * @param {Node} node2 - Second node
     * @param {number} weight - Edge weight to display
     * @param {string} color - Edge color (default: COLORS.EDGE_DEFAULT)
     * @param {number} width - Edge width (default: EDGE_WIDTH)
     */
    drawEdge(node1, node2, weight, color = COLORS.EDGE_DEFAULT, width = EDGE_WIDTH) {
        this.ctx.beginPath();
        this.ctx.moveTo(node1.x, node1.y);
        this.ctx.lineTo(node2.x, node2.y);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();

        // Draw weight label
        if (weight !== undefined && weight !== null) {
            const midX = (node1.x + node2.x) / 2;
            const midY = (node1.y + node2.y) / 2;
            
            this.ctx.fillStyle = COLORS.EDGE_WEIGHT_TEXT;
            this.ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(weight.toString(), midX, midY);
        }
    }

    /**
     * Draw all edges in the graph
     * @param {Array} edges - Array of edge objects {from, to, weight}
     * @param {Array} nodes - Array of Node objects
     */
    drawEdges(edges, nodes) {
        edges.forEach(edge => {
            const n1 = nodes[edge.from];
            const n2 = nodes[edge.to];
            this.drawEdge(n1, n2, edge.weight);
        });
    }

    /**
     * Draw a path (sequence of nodes) as a highlighted line
     * @param {Array} path - Array of node IDs
     * @param {Array} nodes - Array of Node objects
     * @param {string} color - Path color (default: COLORS.NODE_USER_PATH)
     * @param {number} width - Path width (default: USER_PATH_WIDTH)
     */
    drawPath(path, nodes, color = COLORS.NODE_USER_PATH, width = USER_PATH_WIDTH) {
        if (path.length < 2) return;

        this.ctx.beginPath();
        this.ctx.moveTo(nodes[path[0]].x, nodes[path[0]].y);
        
        for (let i = 1; i < path.length; i++) {
            const node = nodes[path[i]];
            this.ctx.lineTo(node.x, node.y);
        }
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }

    /**
     * Draw a single node
     * @param {Node} node - Node to draw
     * @param {Object} state - Node state information
     * @param {number} state.startNode - ID of start node
     * @param {number} state.endNode - ID of end node
     * @param {Array} state.userPath - Array of node IDs in user's path
     * @param {Object} state.userPathCosts - Map of node ID to cumulative cost in user path
     * @param {Array} state.optimalPath - Array of node IDs in optimal path
     * @param {Array} state.visitedNodes - Array of visited node IDs
     * @param {Array} state.highlightNodes - Array of highlighted node IDs
     * @param {Object} state.distances - Map of node ID to distance (for Dijkstra visualization)
     */
    drawNode(node, state = {}) {
        const {
            startNode = null,
            endNode = null,
            userPath = [],
            userPathCosts = {},
            optimalPath = [],
            visitedNodes = [],
            highlightNodes = [],
            distances = {}
        } = state;

        // Determine node color based on state (priority: start/end > optimal > highlight > visited > user path > default)
        let fillColor = COLORS.NODE_DEFAULT;
        
        if (node.id === startNode) {
            fillColor = COLORS.NODE_START;
        } else if (node.id === endNode) {
            fillColor = COLORS.NODE_END;
        } else if (optimalPath.includes(node.id)) {
            fillColor = COLORS.NODE_OPTIMAL_PATH;
        } else if (highlightNodes.includes(node.id)) {
            fillColor = COLORS.NODE_HIGHLIGHT;
        } else if (visitedNodes.includes(node.id)) {
            fillColor = COLORS.NODE_VISITED;
        } else if (userPath.includes(node.id)) {
            fillColor = COLORS.NODE_USER_PATH;
        }

        // Draw node circle
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
        this.ctx.fillStyle = fillColor;
        this.ctx.fill();
        
        // Draw node stroke
        this.ctx.strokeStyle = COLORS.NODE_STROKE;
        this.ctx.lineWidth = NODE_STROKE_WIDTH;
        this.ctx.stroke();

        // Draw cost label (if available)
        let costToDisplay = null;
        
        // Priority: user path cost > Dijkstra distance > nothing
        if (userPathCosts[node.id] !== undefined) {
            costToDisplay = userPathCosts[node.id];
        } else if (distances[node.id] !== undefined && distances[node.id] !== Infinity) {
            costToDisplay = distances[node.id];
        }
        
        if (costToDisplay !== null) {
            this.ctx.fillStyle = COLORS.TEXT;
            this.ctx.font = `bold ${FONT_SIZE}px ${FONT_FAMILY}`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(costToDisplay.toString(), node.x, node.y);
        }
    }

    /**
     * Draw all nodes in the graph
     * @param {Array} nodes - Array of Node objects
     * @param {Object} state - State object for node rendering
     */
    drawNodes(nodes, state) {
        nodes.forEach(node => {
            this.drawNode(node, state);
        });
    }

    /**
     * Main draw function - renders the entire graph
     * @param {Object} graphData - Graph data object
     * @param {Array} graphData.nodes - Array of Node objects
     * @param {Array} graphData.edges - Array of edge objects
     * @param {number} graphData.startNode - Start node ID
     * @param {number} graphData.endNode - End node ID
     * @param {Array} userPath - User's current path (array of node IDs)
     * @param {Object} userPathCosts - Map of node ID to cumulative cost in user path
     * @param {Array} highlightNodes - Nodes to highlight (for algorithm visualization)
     * @param {Array} visitedNodes - Nodes visited by algorithm
     * @param {Array} optimalPath - Optimal path found by algorithm
     * @param {Object} distances - Map of node ID to distance (for Dijkstra visualization)
     */
    draw(graphData, userPath = [], highlightNodes = [], visitedNodes = [], optimalPath = [], userPathCosts = {}, distances = {}) {
        this.clear();

        const { nodes, edges, startNode, endNode } = graphData;

        // Draw edges first (so they appear behind nodes)
        this.drawEdges(edges, nodes);

        // Draw optimal path (behind user path)
        if (optimalPath.length > 1) {
            this.drawPath(optimalPath, nodes, COLORS.NODE_OPTIMAL_PATH, OPTIMAL_PATH_WIDTH);
        }

        // Draw user path highlight (on top of optimal path)
        if (userPath.length > 1) {
            this.drawPath(userPath, nodes, COLORS.NODE_USER_PATH, USER_PATH_WIDTH);
        }

        // Draw nodes
        const state = {
            startNode,
            endNode,
            userPath,
            userPathCosts,
            optimalPath,
            visitedNodes,
            highlightNodes,
            distances
        };
        this.drawNodes(nodes, state);
    }

    /**
     * Get the node at a given screen coordinate (for click detection)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Array} nodes - Array of Node objects
     * @returns {Node|null} The node at the coordinate, or null if none found
     */
    getNodeAt(x, y, nodes) {
        for (const node of nodes) {
            const dist = Math.hypot(x - node.x, y - node.y);
            if (dist < NODE_CLICK_RADIUS) {
                return node;
            }
        }
        return null;
    }
}

