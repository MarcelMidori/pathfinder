/**
 * algorithms.js
 * Contains pathfinding algorithm implementations with visualization support
 */

/**
 * Calculate Euclidean distance between two nodes
 * @param {Node} node1 - First node
 * @param {Node} node2 - Second node
 * @returns {number} Euclidean distance
 */
function euclideanDistance(node1, node2) {
    const dx = node1.x - node2.x;
    const dy = node1.y - node2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

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

/**
 * A* (A-Star) algorithm implementation
 * Uses heuristic (Euclidean distance) + actual cost
 * @param {Array} nodes - Array of Node objects
 * @param {number} startNode - Start node ID
 * @param {number} endNode - End node ID
 * @returns {Object} Result object containing path, distance, and visited nodes
 */
export function aStar(nodes, startNode, endNode) {
    const gScore = {}; // Actual cost from start
    const fScore = {}; // gScore + heuristic
    const parent = {};
    const visited = new Set();
    const openSet = new Set([startNode]);
    
    const endNodeObj = nodes.find(n => n.id === endNode);
    
    // Initialize scores
    nodes.forEach(node => {
        gScore[node.id] = Infinity;
        fScore[node.id] = Infinity;
        parent[node.id] = null;
    });
    
    gScore[startNode] = 0;
    const startNodeObj = nodes.find(n => n.id === startNode);
    fScore[startNode] = euclideanDistance(startNodeObj, endNodeObj);
    
    while (openSet.size > 0) {
        // Find node in openSet with lowest fScore
        let minNode = null;
        let minFScore = Infinity;
        
        for (const nodeId of openSet) {
            if (fScore[nodeId] < minFScore) {
                minFScore = fScore[nodeId];
                minNode = nodeId;
            }
        }
        
        if (minNode === null) break;
        
        // If we reached the end node
        if (minNode === endNode) {
            const path = reconstructPath(parent, startNode, endNode);
            const distance = calculatePathWeight(path, nodes);
            return {
                path,
                distance,
                visitedNodes: Array.from(visited)
            };
        }
        
        openSet.delete(minNode);
        visited.add(minNode);
        
        // Update neighbors
        const currentNode = nodes[minNode];
        for (const neighbor of currentNode.neighbors) {
            if (visited.has(neighbor.id)) continue;
            
            const tentativeGScore = gScore[minNode] + neighbor.weight;
            
            if (!openSet.has(neighbor.id)) {
                openSet.add(neighbor.id);
            } else if (tentativeGScore >= gScore[neighbor.id]) {
                continue;
            }
            
            parent[neighbor.id] = minNode;
            gScore[neighbor.id] = tentativeGScore;
            const neighborNode = nodes[neighbor.id];
            fScore[neighbor.id] = gScore[neighbor.id] + euclideanDistance(neighborNode, endNodeObj);
        }
    }
    
    // No path found
    return {
        path: [],
        distance: null,
        visitedNodes: Array.from(visited)
    };
}

/**
 * Animated A* visualization
 */
export async function aStarAnimated(nodes, startNode, endNode, onStep, onComplete, delay = 300) {
    const gScore = {};
    const fScore = {};
    const parent = {};
    const visited = new Set();
    const openSet = new Set([startNode]);
    const distances = {}; // For visualization compatibility
    
    const endNodeObj = nodes.find(n => n.id === endNode);
    
    nodes.forEach(node => {
        gScore[node.id] = Infinity;
        fScore[node.id] = Infinity;
        distances[node.id] = Infinity;
        parent[node.id] = null;
    });
    
    gScore[startNode] = 0;
    distances[startNode] = 0;
    const startNodeObj = nodes.find(n => n.id === startNode);
    fScore[startNode] = euclideanDistance(startNodeObj, endNodeObj);
    
    while (openSet.size > 0) {
        let minNode = null;
        let minFScore = Infinity;
        
        for (const nodeId of openSet) {
            if (fScore[nodeId] < minFScore) {
                minFScore = fScore[nodeId];
                minNode = nodeId;
            }
        }
        
        if (minNode === null) break;
        
        if (minNode === endNode) {
            const path = reconstructPath(parent, startNode, endNode);
            const distance = calculatePathWeight(path, nodes);
            const result = {
                path,
                distance,
                visitedNodes: Array.from(visited)
            };
            if (onComplete) onComplete(result);
            return result;
        }
        
        openSet.delete(minNode);
        visited.add(minNode);
        
        if (onStep) {
            await new Promise(resolve => setTimeout(resolve, delay));
            onStep(minNode, Array.from(visited), distances);
        }
        
        const currentNode = nodes[minNode];
        for (const neighbor of currentNode.neighbors) {
            if (visited.has(neighbor.id)) continue;
            
            const tentativeGScore = gScore[minNode] + neighbor.weight;
            
            if (!openSet.has(neighbor.id)) {
                openSet.add(neighbor.id);
            } else if (tentativeGScore >= gScore[neighbor.id]) {
                continue;
            }
            
            parent[neighbor.id] = minNode;
            gScore[neighbor.id] = tentativeGScore;
            distances[neighbor.id] = tentativeGScore;
            const neighborNode = nodes[neighbor.id];
            fScore[neighbor.id] = gScore[neighbor.id] + euclideanDistance(neighborNode, endNodeObj);
        }
    }
    
    const result = {
        path: [],
        distance: null,
        visitedNodes: Array.from(visited)
    };
    if (onComplete) onComplete(result);
    return result;
}

/**
 * BFS (Breadth-First Search) algorithm implementation
 * Explores level by level, uses actual edge weights
 * @param {Array} nodes - Array of Node objects
 * @param {number} startNode - Start node ID
 * @param {number} endNode - End node ID
 * @returns {Object} Result object containing path, distance, and visited nodes
 */
export function bfs(nodes, startNode, endNode) {
    const queue = [{ id: startNode, cost: 0 }];
    const visited = new Set();
    const parent = {};
    const distances = {};
    
    nodes.forEach(node => {
        distances[node.id] = Infinity;
        parent[node.id] = null;
    });
    
    distances[startNode] = 0;
    
    while (queue.length > 0) {
        const { id: currentId, cost } = queue.shift();
        
        if (visited.has(currentId)) continue;
        
        visited.add(currentId);
        
        if (currentId === endNode) {
            const path = reconstructPath(parent, startNode, endNode);
            const distance = calculatePathWeight(path, nodes);
            return {
                path,
                distance,
                visitedNodes: Array.from(visited)
            };
        }
        
        const currentNode = nodes[currentId];
        for (const neighbor of currentNode.neighbors) {
            if (!visited.has(neighbor.id)) {
                const newCost = cost + neighbor.weight;
                if (newCost < distances[neighbor.id]) {
                    distances[neighbor.id] = newCost;
                    parent[neighbor.id] = currentId;
                    queue.push({ id: neighbor.id, cost: newCost });
                }
            }
        }
    }
    
    return {
        path: [],
        distance: null,
        visitedNodes: Array.from(visited)
    };
}

/**
 * Animated BFS visualization
 */
export async function bfsAnimated(nodes, startNode, endNode, onStep, onComplete, delay = 300) {
    const queue = [{ id: startNode, cost: 0 }];
    const visited = new Set();
    const parent = {};
    const distances = {};
    
    nodes.forEach(node => {
        distances[node.id] = Infinity;
        parent[node.id] = null;
    });
    
    distances[startNode] = 0;
    
    while (queue.length > 0) {
        const { id: currentId, cost } = queue.shift();
        
        if (visited.has(currentId)) continue;
        
        visited.add(currentId);
        
        if (onStep) {
            await new Promise(resolve => setTimeout(resolve, delay));
            onStep(currentId, Array.from(visited), distances);
        }
        
        if (currentId === endNode) {
            const path = reconstructPath(parent, startNode, endNode);
            const distance = calculatePathWeight(path, nodes);
            const result = {
                path,
                distance,
                visitedNodes: Array.from(visited)
            };
            if (onComplete) onComplete(result);
            return result;
        }
        
        const currentNode = nodes[currentId];
        for (const neighbor of currentNode.neighbors) {
            if (!visited.has(neighbor.id)) {
                const newCost = cost + neighbor.weight;
                if (newCost < distances[neighbor.id]) {
                    distances[neighbor.id] = newCost;
                    parent[neighbor.id] = currentId;
                    queue.push({ id: neighbor.id, cost: newCost });
                }
            }
        }
    }
    
    const result = {
        path: [],
        distance: null,
        visitedNodes: Array.from(visited)
    };
    if (onComplete) onComplete(result);
    return result;
}

/**
 * DFS (Depth-First Search) algorithm implementation
 * Explores deep before wide, may not find optimal path
 * @param {Array} nodes - Array of Node objects
 * @param {number} startNode - Start node ID
 * @param {number} endNode - End node ID
 * @returns {Object} Result object containing path, distance, and visited nodes
 */
export function dfs(nodes, startNode, endNode) {
    const stack = [{ id: startNode, path: [startNode], cost: 0 }];
    const visited = new Set();
    let bestPath = [];
    let bestDistance = Infinity;
    
    while (stack.length > 0) {
        const { id: currentId, path, cost } = stack.pop();
        
        if (visited.has(currentId)) continue;
        
        visited.add(currentId);
        
        if (currentId === endNode) {
            const distance = calculatePathWeight(path, nodes);
            if (distance < bestDistance) {
                bestPath = [...path];
                bestDistance = distance;
            }
            continue; // Continue searching for potentially better paths
        }
        
        const currentNode = nodes[currentId];
        for (const neighbor of currentNode.neighbors) {
            if (!visited.has(neighbor.id)) {
                stack.push({
                    id: neighbor.id,
                    path: [...path, neighbor.id],
                    cost: cost + neighbor.weight
                });
            }
        }
    }
    
    return {
        path: bestPath.length > 0 ? bestPath : [],
        distance: bestDistance === Infinity ? null : bestDistance,
        visitedNodes: Array.from(visited)
    };
}

/**
 * Animated DFS visualization
 */
export async function dfsAnimated(nodes, startNode, endNode, onStep, onComplete, delay = 300) {
    const stack = [{ id: startNode, path: [startNode], cost: 0 }];
    const visited = new Set();
    const distances = {};
    let bestPath = [];
    let bestDistance = Infinity;
    
    nodes.forEach(node => {
        distances[node.id] = Infinity;
    });
    distances[startNode] = 0;
    
    while (stack.length > 0) {
        const { id: currentId, path, cost } = stack.pop();
        
        if (visited.has(currentId)) continue;
        
        visited.add(currentId);
        distances[currentId] = cost;
        
        if (onStep) {
            await new Promise(resolve => setTimeout(resolve, delay));
            onStep(currentId, Array.from(visited), distances);
        }
        
        if (currentId === endNode) {
            const distance = calculatePathWeight(path, nodes);
            if (distance < bestDistance) {
                bestPath = [...path];
                bestDistance = distance;
            }
            continue;
        }
        
        const currentNode = nodes[currentId];
        for (const neighbor of currentNode.neighbors) {
            if (!visited.has(neighbor.id)) {
                stack.push({
                    id: neighbor.id,
                    path: [...path, neighbor.id],
                    cost: cost + neighbor.weight
                });
            }
        }
    }
    
    const result = {
        path: bestPath.length > 0 ? bestPath : [],
        distance: bestDistance === Infinity ? null : bestDistance,
        visitedNodes: Array.from(visited)
    };
    if (onComplete) onComplete(result);
    return result;
}

/**
 * Greedy Best-First Search algorithm implementation
 * Always picks node closest to goal (heuristic only, ignores actual cost)
 * @param {Array} nodes - Array of Node objects
 * @param {number} startNode - Start node ID
 * @param {number} endNode - End node ID
 * @returns {Object} Result object containing path, distance, and visited nodes
 */
export function greedyBestFirst(nodes, startNode, endNode) {
    const openSet = new Set([startNode]);
    const visited = new Set();
    const parent = {};
    const endNodeObj = nodes.find(n => n.id === endNode);
    
    nodes.forEach(node => {
        parent[node.id] = null;
    });
    
    while (openSet.size > 0) {
        // Find node with minimum heuristic distance to goal
        let minNode = null;
        let minHeuristic = Infinity;
        
        for (const nodeId of openSet) {
            const node = nodes[nodeId];
            const heuristic = euclideanDistance(node, endNodeObj);
            if (heuristic < minHeuristic) {
                minHeuristic = heuristic;
                minNode = nodeId;
            }
        }
        
        if (minNode === null) break;
        
        openSet.delete(minNode);
        visited.add(minNode);
        
        if (minNode === endNode) {
            const path = reconstructPath(parent, startNode, endNode);
            const distance = calculatePathWeight(path, nodes);
            return {
                path,
                distance,
                visitedNodes: Array.from(visited)
            };
        }
        
        const currentNode = nodes[minNode];
        for (const neighbor of currentNode.neighbors) {
            if (!visited.has(neighbor.id) && !openSet.has(neighbor.id)) {
                parent[neighbor.id] = minNode;
                openSet.add(neighbor.id);
            }
        }
    }
    
    return {
        path: [],
        distance: null,
        visitedNodes: Array.from(visited)
    };
}

/**
 * Animated Greedy Best-First Search visualization
 */
export async function greedyBestFirstAnimated(nodes, startNode, endNode, onStep, onComplete, delay = 300) {
    const openSet = new Set([startNode]);
    const visited = new Set();
    const parent = {};
    const distances = {};
    const endNodeObj = nodes.find(n => n.id === endNode);
    
    nodes.forEach(node => {
        parent[node.id] = null;
        distances[node.id] = Infinity;
    });
    distances[startNode] = 0;
    
    while (openSet.size > 0) {
        let minNode = null;
        let minHeuristic = Infinity;
        
        for (const nodeId of openSet) {
            const node = nodes[nodeId];
            const heuristic = euclideanDistance(node, endNodeObj);
            if (heuristic < minHeuristic) {
                minHeuristic = heuristic;
                minNode = nodeId;
            }
        }
        
        if (minNode === null) break;
        
        openSet.delete(minNode);
        visited.add(minNode);
        
        if (onStep) {
            await new Promise(resolve => setTimeout(resolve, delay));
            onStep(minNode, Array.from(visited), distances);
        }
        
        if (minNode === endNode) {
            const path = reconstructPath(parent, startNode, endNode);
            const distance = calculatePathWeight(path, nodes);
            const result = {
                path,
                distance,
                visitedNodes: Array.from(visited)
            };
            if (onComplete) onComplete(result);
            return result;
        }
        
        const currentNode = nodes[minNode];
        for (const neighbor of currentNode.neighbors) {
            if (!visited.has(neighbor.id) && !openSet.has(neighbor.id)) {
                parent[neighbor.id] = minNode;
                // Update distance for visualization (cumulative from start)
                const currentDist = distances[minNode] || 0;
                distances[neighbor.id] = currentDist + neighbor.weight;
                openSet.add(neighbor.id);
            }
        }
    }
    
    const result = {
        path: [],
        distance: null,
        visitedNodes: Array.from(visited)
    };
    if (onComplete) onComplete(result);
    return result;
}

