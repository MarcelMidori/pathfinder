/**
 * algorithms.js
 * Contains pathfinding algorithm implementations with visualization support
 */

/**
 * Calculate the total weight of a path
 * @param {Array} path - Array of node IDs representing the path
 * @param {Array} nodes - Array of Node objects
 * @returns {number} Total path weight
 */
export function calculatePathWeight(path, nodes) {
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const currentNode = nodes[path[i]];
        const nextNodeId = path[i + 1];
        const neighbor = currentNode.neighbors.find(n => n.id === nextNodeId);
        if (neighbor) {
            total += neighbor.weight;
        }
    }
    return total;
}

/**
 * Reconstruct path from parent map
 * @param {Object} parent - Map of node ID to parent node ID
 * @param {number} startNode - Start node ID
 * @param {number} endNode - End node ID
 * @returns {Array} Array of node IDs representing the path, or empty array if no path exists
 */
function reconstructPath(parent, startNode, endNode) {
    const path = [];
    let current = endNode;
    
    while (current !== null && current !== undefined) {
        path.unshift(current);
        current = parent[current];
        
        // Prevent infinite loops
        if (path.length > 1000) break;
    }
    
    // Verify path starts at startNode
    if (path[0] !== startNode) {
        return [];
    }
    
    return path;
}

/**
 * Dijkstra's algorithm implementation
 * @param {Array} nodes - Array of Node objects
 * @param {number} startNode - Start node ID
 * @param {number} endNode - End node ID
 * @returns {Object} Result object containing path, distance, and visited nodes
 */
export function dijkstra(nodes, startNode, endNode) {
    const distances = {};
    const parent = {};
    const visited = new Set();
    const unvisited = new Set();
    
    // Initialize distances
    nodes.forEach(node => {
        distances[node.id] = Infinity;
        parent[node.id] = null;
        unvisited.add(node.id);
    });
    
    distances[startNode] = 0;
    
    while (unvisited.size > 0) {
        // Find unvisited node with minimum distance
        let minNode = null;
        let minDist = Infinity;
        
        for (const nodeId of unvisited) {
            if (distances[nodeId] < minDist) {
                minDist = distances[nodeId];
                minNode = nodeId;
            }
        }
        
        // If no reachable nodes found, break
        if (minNode === null || minDist === Infinity) {
            break;
        }
        
        // Mark as visited
        visited.add(minNode);
        unvisited.delete(minNode);
        
        // If we reached the end node, we can stop early
        if (minNode === endNode) {
            break;
        }
        
        // Update distances to neighbors
        const currentNode = nodes[minNode];
        for (const neighbor of currentNode.neighbors) {
            if (!visited.has(neighbor.id)) {
                const newDist = distances[minNode] + neighbor.weight;
                if (newDist < distances[neighbor.id]) {
                    distances[neighbor.id] = newDist;
                    parent[neighbor.id] = minNode;
                }
            }
        }
    }
    
    // Reconstruct path
    const path = reconstructPath(parent, startNode, endNode);
    const distance = distances[endNode] === Infinity ? null : distances[endNode];
    
    return {
        path,
        distance,
        visitedNodes: Array.from(visited)
    };
}

/**
 * Animated Dijkstra visualization
 * Runs Dijkstra's algorithm step-by-step with visualization callbacks
 * @param {Array} nodes - Array of Node objects
 * @param {number} startNode - Start node ID
 * @param {number} endNode - End node ID
 * @param {Function} onStep - Callback function called on each step
 *                           Parameters: (currentNode, visitedNodes, distances)
 * @param {Function} onComplete - Callback function called when algorithm completes
 *                               Parameters: (result) where result contains {path, distance, visitedNodes}
 * @param {number} delay - Delay between steps in milliseconds (default: 300)
 */
export async function dijkstraAnimated(nodes, startNode, endNode, onStep, onComplete, delay = 300) {
    const distances = {};
    const parent = {};
    const visited = new Set();
    const unvisited = new Set();
    
    // Initialize distances
    nodes.forEach(node => {
        distances[node.id] = Infinity;
        parent[node.id] = null;
        unvisited.add(node.id);
    });
    
    distances[startNode] = 0;
    
    while (unvisited.size > 0) {
        // Find unvisited node with minimum distance
        let minNode = null;
        let minDist = Infinity;
        
        for (const nodeId of unvisited) {
            if (distances[nodeId] < minDist) {
                minDist = distances[nodeId];
                minNode = nodeId;
            }
        }
        
        // If no reachable nodes found, break
        if (minNode === null || minDist === Infinity) {
            break;
        }
        
        // Mark as visited
        visited.add(minNode);
        unvisited.delete(minNode);
        
        // Call step callback for visualization
        if (onStep) {
            await new Promise(resolve => setTimeout(resolve, delay));
            onStep(minNode, Array.from(visited), distances);
        }
        
        // If we reached the end node, we can stop early
        if (minNode === endNode) {
            break;
        }
        
        // Update distances to neighbors
        const currentNode = nodes[minNode];
        for (const neighbor of currentNode.neighbors) {
            if (!visited.has(neighbor.id)) {
                const newDist = distances[minNode] + neighbor.weight;
                if (newDist < distances[neighbor.id]) {
                    distances[neighbor.id] = newDist;
                    parent[neighbor.id] = minNode;
                }
            }
        }
    }
    
    // Reconstruct path
    const path = reconstructPath(parent, startNode, endNode);
    const distance = distances[endNode] === Infinity ? null : distances[endNode];
    
    const result = {
        path,
        distance,
        visitedNodes: Array.from(visited)
    };
    
    // Call completion callback
    if (onComplete) {
        onComplete(result);
    }
    
    return result;
}

