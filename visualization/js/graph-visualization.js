// Graph Analyzer Visualization

// Wait for both DOM and D3 to be ready
function initializeWhenReady() {
    // Check if D3.js is available
    if (typeof d3 === 'undefined') {
        console.error('D3.js is not loaded. Retrying...');
        setTimeout(initializeWhenReady, 100);
        return;
    }
    
    // Check if container exists
    const container = document.getElementById('graph-2d-viz');
    if (!container) {
        console.log('Container not found yet, retrying...');
        setTimeout(initializeWhenReady, 100);
        return;
    }
    
    console.log('Initializing graph visualization...');
    
    // Initialize Graph visualization
    initGraphVisualization();
    
    // Automatically load sample data
    loadSampleGraphData();
}

// Try multiple initialization strategies
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWhenReady);
} else {
    // DOM is already ready
    initializeWhenReady();
}

// Global variables
let graphData = null;
let graphVisualization = null;
let currentSimulation = null;
let currentNodePositions = new Map();
let selectedNode = null;
let isAnimating = false;
let currentLayout = 'force';
let graphContainer = null;

// Initialize Graph visualization
function initGraphVisualization() {
    // Set up event listeners
    const fileInput = document.getElementById('graph-file');
    if (fileInput) {
        fileInput.addEventListener('change', handleGraphFileUpload);
    }
    
    // Layout selector
    const layoutSelect = document.getElementById('graph-layout');
    if (layoutSelect) {
        layoutSelect.addEventListener('change', (e) => {
            currentLayout = e.target.value;
            if (graphData) {
                updateGraphVisualization(graphData);
            }
        });
    }
    
    // Animation buttons
    const animateBfsBtn = document.getElementById('graph-animate-bfs');
    const animateDfsBtn = document.getElementById('graph-animate-dfs');
    const resetBtn = document.getElementById('graph-reset');
    
    if (animateBfsBtn) {
        animateBfsBtn.addEventListener('click', () => animateTraversal('bfs'));
    }
    
    if (animateDfsBtn) {
        animateDfsBtn.addEventListener('click', () => animateTraversal('dfs'));
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            selectedNode = null;
            if (graphData) {
                updateGraphVisualization(graphData);
            }
        });
    }
    
    
    // Try to initialize 3D visualization if Three.js is available
    try {
        import('./three-utils.js').then(module => {
            graphVisualization = new module.GraphVisualization('graph-3d-viz');
            if (graphData) {
                update3DVisualization(graphData);
            }
        }).catch(err => {
            console.log('Three.js not available, using 2D visualization only');
        });
    } catch (err) {
        console.log('Three.js not available, using 2D visualization only');
    }
}

// Load sample graph data automatically
async function loadSampleGraphData() {
    console.log('loadSampleGraphData called');
    
    // Wait a bit for DOM to be fully ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if container exists
    const container = document.getElementById('graph-2d-viz');
    if (!container) {
        console.error('Container graph-2d-viz not found, retrying...');
        setTimeout(() => loadSampleGraphData(), 500);
        return;
    }
    
    // Immediately display default data
    const defaultData = createDefaultGraphData();
    console.log('Default data created:', defaultData);
    graphData = defaultData;
    updateGraphVisualization(defaultData);
    
    // Try to load from file in the background
    try {
        const data = await fetchJSON('../output/graph_analysis_results.json');
        if (data) {
            graphData = data;
            updateGraphVisualization(data);
        }
    } catch (error) {
        console.log('Could not load JSON file, using default data:', error);
    }
}

// Create default graph data
function createDefaultGraphData() {
    const data = {
        nodes: [
            {id: "A", degree: 3, centrality: 0.12},
            {id: "B", degree: 2, centrality: 0.08},
            {id: "C", degree: 2, centrality: 0.08},
            {id: "D", degree: 2, centrality: 0.08},
            {id: "E", degree: 1, centrality: 0.04}
        ],
        edges: [
            {source: "A", target: "B", weight: 0.9},
            {source: "A", target: "C", weight: 0.8},
            {source: "A", target: "D", weight: 0.85},
            {source: "B", target: "E", weight: 0.75}
        ],
        bfs_order: ["A", "B", "C", "D", "E"],
        dfs_order: ["A", "B", "E", "C", "D"]
    };
    console.log('Default graph data created:', data);
    return data;
}

// Handle graph file upload
function handleGraphFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                graphData = data;
                updateGraphVisualization(data);
            } catch (error) {
                console.error('Error parsing graph JSON:', error);
                alert('Invalid JSON file format');
            }
        };
        reader.readAsText(file);
    }
}

// Update graph visualization
function updateGraphVisualization(data) {
    if (!data || !data.nodes || !data.edges) {
        console.error('Invalid graph data format');
        return;
    }
    
    // Update traversal lists
    updateTraversalLists(data);
    
    // Update 2D visualization
    update2DVisualization(data);
    
    // Update 3D visualization if available
    if (graphVisualization) {
        update3DVisualization(data);
    }
}

// Update traversal lists
function updateTraversalLists(data) {
    // Update BFS traversal
    const bfsList = document.getElementById('bfs-traversal');
    if (bfsList) {
        bfsList.innerHTML = '';
        
        if (data.bfs_order && data.bfs_order.length > 0) {
            data.bfs_order.forEach((node, idx) => {
                const li = document.createElement('li');
                li.textContent = node;
                li.style.cssText = 'padding: 0.3rem; cursor: pointer; transition: background 0.2s;';
                li.dataset.nodeId = node;
                li.dataset.traversalIndex = idx;
                
                li.addEventListener('click', () => {
                    highlightNodeInGraph(node);
                });
                
                li.addEventListener('mouseenter', () => {
                    li.style.background = 'rgba(162, 123, 92, 0.2)';
                    highlightNodeInGraph(node, true);
                });
                
                li.addEventListener('mouseleave', () => {
                    li.style.background = '';
                    highlightNodeInGraph(node, false);
                });
                
                bfsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No BFS traversal data available';
            bfsList.appendChild(li);
        }
    }
    
    // Update DFS traversal
    const dfsList = document.getElementById('dfs-traversal');
    if (dfsList) {
        dfsList.innerHTML = '';
        
        if (data.dfs_order && data.dfs_order.length > 0) {
            data.dfs_order.forEach((node, idx) => {
                const li = document.createElement('li');
                li.textContent = node;
                li.style.cssText = 'padding: 0.3rem; cursor: pointer; transition: background 0.2s;';
                li.dataset.nodeId = node;
                li.dataset.traversalIndex = idx;
                
                li.addEventListener('click', () => {
                    highlightNodeInGraph(node);
                });
                
                li.addEventListener('mouseenter', () => {
                    li.style.background = 'rgba(162, 123, 92, 0.2)';
                    highlightNodeInGraph(node, true);
                });
                
                li.addEventListener('mouseleave', () => {
                    li.style.background = '';
                    highlightNodeInGraph(node, false);
                });
                
                dfsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No DFS traversal data available';
            dfsList.appendChild(li);
        }
    }
    
    // Update node centrality
    const centralityList = document.getElementById('node-centrality');
    if (centralityList) {
        centralityList.innerHTML = '';
        
        if (data.nodes && data.nodes.length > 0) {
            // Sort nodes by centrality (descending)
            const sortedNodes = [...data.nodes].sort((a, b) => b.centrality - a.centrality);
            
            sortedNodes.forEach(node => {
                const li = document.createElement('li');
                li.textContent = `${node.id}: ${node.centrality.toFixed(3)}`;
                li.style.cssText = 'padding: 0.3rem; cursor: pointer; transition: background 0.2s;';
                li.dataset.nodeId = node.id;
                
                li.addEventListener('click', () => {
                    highlightNodeInGraph(node.id);
                });
                
                li.addEventListener('mouseenter', () => {
                    li.style.background = 'rgba(162, 123, 92, 0.2)';
                    highlightNodeInGraph(node.id, true);
                });
                
                li.addEventListener('mouseleave', () => {
                    li.style.background = '';
                    highlightNodeInGraph(node.id, false);
                });
                
                centralityList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No centrality data available';
            centralityList.appendChild(li);
        }
    }
}

// Highlight node in graph
function highlightNodeInGraph(nodeId, isHover = false) {
    if (!currentSimulation) return;
    
    const svg = d3.select('#graph-2d-viz svg');
    if (svg.empty()) return;
    
    // Reset all nodes
    svg.selectAll('circle').attr('fill', '#3498db').attr('stroke-width', 2);
    svg.selectAll('line').attr('stroke', '#95a5a6').attr('stroke-opacity', 0.6);
    
    // Highlight selected node
    svg.selectAll('circle').filter(d => d.id === nodeId)
        .attr('fill', isHover ? '#e74c3c' : '#2ecc71')
        .attr('stroke-width', 4);
    
    // Highlight connected edges
    svg.selectAll('line')
        .filter(d => d.source.id === nodeId || d.target.id === nodeId)
        .attr('stroke', '#e74c3c')
        .attr('stroke-opacity', 1)
        .attr('stroke-width', 3);
}

// Find shortest path using BFS
function findShortestPath(startNodeId, targetNodeId, edges, nodes) {
    if (startNodeId === targetNodeId) return [startNodeId];
    
    // Build adjacency list
    const adjList = new Map();
    nodes.forEach(n => adjList.set(n.id, []));
    edges.forEach(e => {
        adjList.get(e.source).push(e.target);
        adjList.get(e.target).push(e.source);
    });
    
    // BFS
    const queue = [[startNodeId]];
    const visited = new Set([startNodeId]);
    
    while (queue.length > 0) {
        const path = queue.shift();
        const current = path[path.length - 1];
        
        for (const neighbor of adjList.get(current) || []) {
            if (neighbor === targetNodeId) {
                return [...path, neighbor];
            }
            
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push([...path, neighbor]);
            }
        }
    }
    
    return null; // No path found
}

// Animate traversal
async function animateTraversal(type) {
    if (!graphData || isAnimating) return;
    
    isAnimating = true;
    const order = type === 'bfs' ? graphData.bfs_order : graphData.dfs_order;
    if (!order || order.length === 0) {
        isAnimating = false;
        return;
    }
    
    const svg = d3.select('#graph-2d-viz svg');
    if (svg.empty()) {
        isAnimating = false;
        return;
    }
    
    // Reset all nodes
    svg.selectAll('circle').attr('fill', '#3498db');
    
    // Animate step by step
    for (let i = 0; i < order.length; i++) {
        const nodeId = order[i];
        
        // Highlight current node
        svg.selectAll('circle')
            .filter(d => d.id === nodeId)
            .transition()
            .duration(300)
            .attr('fill', '#2ecc71');
        
        // Highlight traversal list item
        const listItems = document.querySelectorAll(`#${type}-traversal li`);
        if (listItems[i]) {
            listItems[i].style.background = '#2ecc71';
            listItems[i].style.color = 'white';
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Reset after animation
    setTimeout(() => {
        svg.selectAll('circle').attr('fill', '#3498db');
        document.querySelectorAll(`#${type}-traversal li`).forEach(li => {
            li.style.background = '';
            li.style.color = '';
        });
        isAnimating = false;
    }, 1000);
}

// Update 2D visualization
function update2DVisualization(data) {
    console.log('update2DVisualization called', data);
    const vizContainer = document.getElementById('graph-2d-viz');
    if (!vizContainer) {
        console.error('graph-2d-viz container not found');
        return;
    }
    
    console.log('Container found:', vizContainer);
    
    // Ensure the panel is visible
    vizContainer.classList.add('active');
    vizContainer.style.display = 'block';
    vizContainer.style.position = 'absolute';
    vizContainer.style.top = '0';
    vizContainer.style.left = '0';
    vizContainer.style.width = '100%';
    vizContainer.style.height = '100%';
    
    // Clear previous visualization
    vizContainer.innerHTML = '';
    
    if (!data || !data.nodes || !data.edges) {
        console.error('Invalid data:', data);
        vizContainer.innerHTML = '<p style="padding: 2rem; text-align: center; color: #DCD7C9;">No graph data available</p>';
        return;
    }
    
    console.log('Data valid, nodes:', data.nodes.length, 'edges:', data.edges.length);
    
    // Get container dimensions - use parent container which has explicit height
    const parentContainer = document.getElementById('graph-viz-container');
    let width = 800;
    let height = 550;
    
    if (parentContainer) {
        width = parentContainer.clientWidth || parentContainer.offsetWidth || parentContainer.getBoundingClientRect().width || 800;
        height = parentContainer.clientHeight || parentContainer.offsetHeight || parentContainer.getBoundingClientRect().height || 550;
        console.log('Parent container dimensions:', width, height);
    } else {
        console.warn('Parent container not found, using defaults');
        // Fallback to vizContainer dimensions
        width = vizContainer.clientWidth || vizContainer.offsetWidth || 800;
        height = vizContainer.clientHeight || vizContainer.offsetHeight || 500;
    }
    
    // Ensure minimum dimensions
    if (width <= 0) {
        console.warn('Width is 0, using default 800');
        width = 800;
    }
    if (height <= 0) {
        console.warn('Height is 0, using default 550');
        height = 550;
    }
    
    console.log('Final dimensions:', width, height);
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
        try {
            createGraphSVG(vizContainer, data, width, height);
            console.log('Graph SVG created successfully');
        } catch (error) {
            console.error('Error creating graph SVG:', error);
            vizContainer.innerHTML = '<p style="padding: 2rem; text-align: center; color: #DCD7C9;">Error creating visualization: ' + error.message + '</p>';
        }
    });
}

function createGraphSVG(vizContainer, data, width, height) {
    console.log('createGraphSVG called with dimensions:', width, height);
    
    if (!vizContainer) {
        console.error('vizContainer is null');
        return;
    }
    
    if (typeof d3 === 'undefined') {
        console.error('D3 is not available in createGraphSVG');
        vizContainer.innerHTML = '<p style="padding: 2rem; text-align: center; color: #DCD7C9;">D3.js is not loaded</p>';
        return;
    }
    
    // Create SVG element
    const svg = d3.select(vizContainer)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('cursor', 'default')
        .style('background', 'transparent')
        .style('display', 'block')
        .style('position', 'absolute')
        .style('top', '0')
        .style('left', '0')
        .style('width', '100%')
        .style('height', '100%');
    
    console.log('SVG created:', svg.node(), 'Dimensions:', width, height);
    
    if (!svg.node()) {
        console.error('Failed to create SVG element');
        return;
    }
    
    // Create container group for graph elements
    graphContainer = svg.append('g');
    const container = graphContainer;
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('id', 'graph-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0,0,0,0.8)')
        .style('color', 'white')
        .style('padding', '0.5rem')
        .style('border-radius', '4px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', 1000);
    
    // Prepare nodes and edges for D3
    const nodes = data.nodes.map(n => ({...n, x: null, y: null}));
    const edges = data.edges.map(e => ({
        source: typeof e.source === 'string' ? nodes.find(n => n.id === e.source) : e.source,
        target: typeof e.target === 'string' ? nodes.find(n => n.id === e.target) : e.target,
        weight: e.weight || 1
    }));
    
    // Apply layout
    if (currentLayout === 'circular') {
        const radius = Math.min(width, height) / 3;
        const angleStep = (2 * Math.PI) / nodes.length;
        nodes.forEach((node, i) => {
            node.x = width / 2 + radius * Math.cos(i * angleStep);
            node.y = height / 2 + radius * Math.sin(i * angleStep);
            node.fx = node.x;
            node.fy = node.y;
        });
    } else if (currentLayout === 'hierarchical') {
        // Simple hierarchical layout
        const levels = {};
        const startNode = nodes[0];
        const visited = new Set();
        const queue = [{node: startNode, level: 0}];
        visited.add(startNode.id);
        
        while (queue.length > 0) {
            const {node, level} = queue.shift();
            if (!levels[level]) levels[level] = [];
            levels[level].push(node);
            
            edges.forEach(e => {
                const neighbor = e.source.id === node.id ? e.target : (e.target.id === node.id ? e.source : null);
                if (neighbor && !visited.has(neighbor.id)) {
                    visited.add(neighbor.id);
                    queue.push({node: neighbor, level: level + 1});
                }
            });
        }
        
        const maxLevel = Math.max(...Object.keys(levels).map(Number));
        Object.keys(levels).forEach(level => {
            const levelNodes = levels[level];
            const yPos = (height / (maxLevel + 1)) * (parseInt(level) + 1);
            levelNodes.forEach((node, idx) => {
                node.x = (width / (levelNodes.length + 1)) * (idx + 1);
                node.y = yPos;
                node.fx = node.x;
                node.fy = node.y;
            });
        });
    }
    
    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(edges).id(d => d.id).distance(100))
        .force('charge', currentLayout === 'force' ? d3.forceManyBody().strength(-300) : null)
        .force('center', currentLayout === 'force' ? d3.forceCenter(width / 2, height / 2) : null);
    
    currentSimulation = simulation;
    
    // Create links
    const linkElements = svg.append('g')
        .selectAll('line')
        .data(edges)
        .enter()
        .append('line')
        .attr('stroke', '#95a5a6')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', d => 1 + (d.weight || 1) * 2);
    
    // Create nodes
    const nodeElements = svg.append('g')
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('r', d => 8 + d.centrality * 25)
        .attr('fill', '#3498db')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('click', function(event, d) {
            event.stopPropagation();
            selectedNode = selectedNode === d.id ? null : d.id;
            
            if (selectedNode && graphData.bfs_order && graphData.bfs_order.length > 0) {
                const startNode = graphData.bfs_order[0];
                const path = findShortestPath(startNode, selectedNode, edges, nodes);
                
                // Reset all
                nodeElements.attr('fill', '#3498db').attr('stroke-width', 2);
                linkElements.attr('stroke', '#95a5a6').attr('stroke-opacity', 0.6);
                
                // Highlight path
                if (path) {
                    for (let i = 0; i < path.length - 1; i++) {
                        const sourceId = path[i];
                        const targetId = path[i + 1];
                        
                        nodeElements.filter(d => d.id === sourceId || d.id === targetId)
                            .attr('fill', '#2ecc71')
                            .attr('stroke-width', 4);
                        
                        linkElements.filter(d => 
                            (d.source.id === sourceId && d.target.id === targetId) ||
                            (d.source.id === targetId && d.target.id === sourceId)
                        )
                            .attr('stroke', '#2ecc71')
                            .attr('stroke-opacity', 1)
                            .attr('stroke-width', 4);
                    }
                }
            } else {
                // Reset all
                nodeElements.attr('fill', '#3498db').attr('stroke-width', 2);
                linkElements.attr('stroke', '#95a5a6').attr('stroke-opacity', 0.6);
            }
        })
        .on('mouseover', function(event, d) {
            tooltip.transition().duration(200).style('opacity', 1);
            tooltip.html(`
                <strong>Node: ${d.id}</strong><br/>
                Degree: ${d.degree}<br/>
                Centrality: ${d.centrality.toFixed(3)}
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
            
            d3.select(this).attr('stroke-width', 4);
        })
        .on('mouseout', function() {
            tooltip.transition().duration(200).style('opacity', 0);
            d3.select(this).attr('stroke-width', 2);
        })
        .call(d3.drag()
            .on('start', function(event, d) {
                // Stop the simulation when dragging starts to prevent jittery movement
                if (!event.active) {
                    simulation.alphaTarget(0);
                }
                // Lock the node position
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', function(event, d) {
                // Update node position directly - no zoom transform needed
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', function(event, d) {
                // Release the node if using force layout
                if (currentLayout === 'force') {
                    d.fx = null;
                    d.fy = null;
                    if (!event.active) {
                        simulation.alphaTarget(0.3);
                        simulation.restart();
                    }
                } else {
                    // Keep node fixed for other layouts
                    d.fx = event.x;
                    d.fy = event.y;
                }
            }));
    
    // Add node labels
    const labels = container.append('g')
        .selectAll('text')
        .data(nodes)
        .enter()
        .append('text')
        .text(d => d.id)
        .attr('font-size', 12)
        .attr('dx', 12)
        .attr('dy', 4)
        .attr('fill', '#333')
        .style('pointer-events', 'none');
    
    // Update positions on tick
    simulation.on('tick', () => {
        linkElements
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        nodeElements
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
        
        labels
            .attr('x', d => d.x)
            .attr('y', d => d.y);
    });
    
}

// Update 3D visualization
function update3DVisualization(data) {
    if (!graphVisualization) return;
    
    if (!data.nodes || !data.edges) return;
    
    // Set the data for the 3D visualization
    graphVisualization.setData(data.nodes, data.edges);
}