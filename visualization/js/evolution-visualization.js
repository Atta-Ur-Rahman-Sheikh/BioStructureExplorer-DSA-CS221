// Evolution & Mutation Spread Simulator Visualization

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Evolution visualization
    initEvolutionVisualization();
    
    // Automatically load sample data
    loadSampleEvolutionData();
});

// Global variables
let evolutionData = null;
let mutationVisualization = null;
let currentStep = 0;
let isPlaying = false;
let playInterval = null;
let animationSpeed = 500;
let currentView = 'grid';
let growthData = [];
let growthChart = null;

// Initialize Evolution visualization
function initEvolutionVisualization() {
    // Set up event listeners
    const fileInput = document.getElementById('evolution-file');
    if (fileInput) {
        fileInput.addEventListener('change', handleEvolutionFileUpload);
    }
    
    // Set up simulation controls
    const playBtn = document.getElementById('evolution-play');
    const pauseBtn = document.getElementById('evolution-pause');
    const stepBtn = document.getElementById('evolution-step');
    const stepSlider = document.getElementById('evolution-step-slider');
    
    if (playBtn) playBtn.addEventListener('click', playSimulation);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseSimulation);
    if (stepBtn) stepBtn.addEventListener('click', stepSimulation);
    
    if (stepSlider) {
        stepSlider.addEventListener('input', (e) => {
            goToStep(parseInt(e.target.value));
        });
    }
    
    // Speed control
    const speedSlider = document.getElementById('evolution-speed');
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            animationSpeed = parseInt(e.target.value);
            const speedValue = document.getElementById('evolution-speed-value');
            if (speedValue) speedValue.textContent = animationSpeed + 'ms';
        });
    }
    
    // View toggle
    const viewSelect = document.getElementById('evolution-view');
    if (viewSelect) {
        viewSelect.addEventListener('change', (e) => {
            currentView = e.target.value;
            if (evolutionData) {
                update2DVisualization(evolutionData);
            }
        });
    }
    
    // Grid size selector
    const gridSizeSelect = document.getElementById('evolution-grid-size-select');
    if (gridSizeSelect) {
        gridSizeSelect.addEventListener('change', (e) => {
            const newSize = parseInt(e.target.value);
            if (newSize && newSize > 0) {
                pauseSimulation();
                currentStep = 0;
                growthData = [];
                const newData = createDefaultEvolutionData(newSize);
                evolutionData = newData;
                updateEvolutionVisualization(newData, true);
            }
        });
    }
    
    // Reset button
    const resetBtn = document.getElementById('evolution-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            pauseSimulation();
            currentStep = 0;
            growthData = [];
            if (evolutionData) {
                // Reload visualization with reset flag
                updateEvolutionVisualization(evolutionData, true);
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            if (isPlaying) {
                pauseSimulation();
            } else {
                playSimulation();
            }
        }
    });
    
    // Try to initialize 3D visualization if Three.js is available
    try {
        import('./three-utils.js').then(module => {
            mutationVisualization = new module.MutationVisualization('evolution-3d-viz');
            if (evolutionData) {
                update3DVisualization(evolutionData);
            }
        }).catch(err => {
            console.log('Three.js not available, using 2D visualization only');
        });
    } catch (err) {
        console.log('Three.js not available, using 2D visualization only');
    }
}

// Load sample evolution data automatically
async function loadSampleEvolutionData() {
    // Get initial grid size from selector or use default
    const gridSizeSelect = document.getElementById('evolution-grid-size-select');
    const initialSize = gridSizeSelect ? parseInt(gridSizeSelect.value) || 10 : 10;
    
    // Immediately display default data
    const defaultData = createDefaultEvolutionData(initialSize);
    evolutionData = defaultData;
    updateEvolutionVisualization(defaultData, true);
    
    // Try to load from file in the background
    try {
        const data = await fetchJSON('../output/mutation_simulation_results.json');
        if (data) {
            evolutionData = data;
            updateEvolutionVisualization(data, true);
        }
    } catch (error) {
        console.log('Could not load JSON file, using default data');
    }
}

// Create default evolution data with realistic mutation simulation
function createDefaultEvolutionData(gridSize = 10) {
    if (!gridSize || gridSize < 5) gridSize = 10;
    const history = [];
    
    // Mutation and resistance probabilities
    const mutationProb = 0.25; // 25% chance of mutation spreading to neighbor
    const resistanceProb = 0.15; // 15% chance of developing resistance
    
    // Create initial grid with a few mutation hotspots (more realistic)
    let grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
    const center = Math.floor(gridSize / 2);
    
    // Start with 2-3 mutation hotspots for more realistic spread
    grid[center][center] = 1; // Primary hotspot
    if (gridSize > 8) {
        // Add secondary hotspots
        const offset = Math.floor(gridSize / 4);
        if (Math.random() > 0.5) grid[center - offset][center] = 1;
        if (Math.random() > 0.5) grid[center][center + offset] = 1;
    }
    
    history.push({grid: JSON.parse(JSON.stringify(grid))});
    
    // Simulate more steps for better visualization (scales with grid size)
    const numSteps = Math.max(8, Math.floor(gridSize * 0.8));
    
    for (let step = 0; step < numSteps; step++) {
        const newGrid = JSON.parse(JSON.stringify(grid));
        
        // Track mutation age for resistance development
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const currentState = grid[i][j];
                
                if (currentState === 1) { // Mutated cell
                    // Chance to develop resistance (increases over time)
                    if (Math.random() < resistanceProb * (1 + step * 0.1)) {
                        newGrid[i][j] = 2; // Develop resistance
                    } else {
                        // Spread mutation to neighbors (only to normal cells)
                        for (let di = -1; di <= 1; di++) {
                            for (let dj = -1; dj <= 1; dj++) {
                                if (di === 0 && dj === 0) continue;
                                const ni = i + di;
                                const nj = j + dj;
                                if (ni >= 0 && ni < gridSize && nj >= 0 && nj < gridSize) {
                                    // Only spread to normal cells
                                    if (newGrid[ni][nj] === 0 && Math.random() < mutationProb) {
                                        newGrid[ni][nj] = 1;
                                    }
                                }
                            }
                        }
                    }
                } else if (currentState === 2) { // Resistant cell
                    // Resistant cells can still spread but at lower rate
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            if (di === 0 && dj === 0) continue;
                            const ni = i + di;
                            const nj = j + dj;
                            if (ni >= 0 && ni < gridSize && nj >= 0 && nj < gridSize) {
                                // Resistant cells spread mutation at reduced rate
                                if (newGrid[ni][nj] === 0 && Math.random() < mutationProb * 0.5) {
                                    newGrid[ni][nj] = 1;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        grid = newGrid;
        history.push({grid: JSON.parse(JSON.stringify(grid))});
    }
    
    return {
        grid_size: gridSize,
        mutation_probability: mutationProb,
        resistance_probability: resistanceProb,
        history: history
    };
}

// Handle evolution file upload
function handleEvolutionFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                evolutionData = data;
                currentStep = 0;
                growthData = [];
                updateEvolutionVisualization(data, true);
            } catch (error) {
                console.error('Error parsing evolution JSON:', error);
                alert('Invalid JSON file format');
            }
        };
        reader.readAsText(file);
    }
}

// Calculate statistics for current step
function calculateStatistics(data, step) {
    if (!data || !data.history || step >= data.history.length) return null;
    
    const grid = data.history[step].grid;
    let normal = 0, mutated = 0, resistant = 0;
    const total = data.grid_size * data.grid_size;
    
    for (let i = 0; i < data.grid_size; i++) {
        for (let j = 0; j < data.grid_size; j++) {
            switch (grid[i][j]) {
                case 0: normal++; break;
                case 1: mutated++; break;
                case 2: resistant++; break;
            }
        }
    }
    
    return {
        normal, mutated, resistant, total,
        normalPercent: (normal / total * 100).toFixed(1),
        mutatedPercent: (mutated / total * 100).toFixed(1),
        resistantPercent: (resistant / total * 100).toFixed(1)
    };
}

// Update evolution visualization
function updateEvolutionVisualization(data, resetStep = false) {
    if (!data || !data.history || data.history.length === 0) {
        console.error('Invalid evolution data format');
        return;
    }
    
    // Reset current step only if requested (e.g., on initial load or reset button)
    if (resetStep || currentStep >= data.history.length) {
        currentStep = 0;
        growthData = [];
    }
    
    // Update stats
    const mutationProbEl = document.getElementById('evolution-mutation-prob');
    const resistanceProbEl = document.getElementById('evolution-resistance-prob');
    const totalStepsEl = document.getElementById('evolution-step-total');
    const gridSizeSelect = document.getElementById('evolution-grid-size-select');
    
    // Update grid size selector
    if (gridSizeSelect) {
        const sizeValue = data.grid_size || 10;
        gridSizeSelect.value = sizeValue;
    }
    if (mutationProbEl) mutationProbEl.textContent = (data.mutation_probability || 0).toFixed(2);
    if (resistanceProbEl) resistanceProbEl.textContent = (data.resistance_probability || 0).toFixed(2);
    if (totalStepsEl) totalStepsEl.textContent = data.history.length - 1;
    
    // Update step counter and slider
    const stepCounter = document.getElementById('evolution-step-counter');
    const stepSlider = document.getElementById('evolution-step-slider');
    
    if (stepCounter) stepCounter.textContent = currentStep;
    if (stepSlider) {
        stepSlider.max = data.history.length - 1;
        stepSlider.value = currentStep;
    }
    
    // Update real-time statistics
    updateRealTimeStats(data);
    
    // Update 2D visualization
    update2DVisualization(data);
    
    // Update growth chart
    updateGrowthChart();
    
    // Update 3D visualization if available
    if (mutationVisualization) {
        update3DVisualization(data);
    }
}

// Update real-time statistics
function updateRealTimeStats(data) {
    const stats = calculateStatistics(data, currentStep);
    if (!stats) return;
    
    document.getElementById('evolution-normal-count').textContent = stats.normal;
    document.getElementById('evolution-normal-percent').textContent = stats.normalPercent + '%';
    document.getElementById('evolution-mutated-count').textContent = stats.mutated;
    document.getElementById('evolution-mutated-percent').textContent = stats.mutatedPercent + '%';
    document.getElementById('evolution-resistant-count').textContent = stats.resistant;
    document.getElementById('evolution-resistant-percent').textContent = stats.resistantPercent + '%';
    
    // Update growth data (only add if not already present for this step)
    const existingIndex = growthData.findIndex(d => d.step === currentStep);
    if (existingIndex >= 0) {
        growthData[existingIndex] = {
            step: currentStep,
            normal: stats.normal,
            mutated: stats.mutated,
            resistant: stats.resistant
        };
    } else {
        growthData.push({
            step: currentStep,
            normal: stats.normal,
            mutated: stats.mutated,
            resistant: stats.resistant
        });
        // Sort by step
        growthData.sort((a, b) => a.step - b.step);
    }
}

// Update 2D visualization
function update2DVisualization(data) {
    const vizContainer = document.getElementById('evolution-2d-viz');
    if (!vizContainer) return;
    
    // Clear previous visualization
    vizContainer.innerHTML = '';
    
    // Ensure the panel is visible
    vizContainer.classList.add('active');
    vizContainer.style.display = 'block';
    
    if (!data.history || data.history.length === 0) {
        vizContainer.innerHTML = '<p style="padding: 2rem; text-align: center; color: #DCD7C9;">No evolution data available</p>';
        return;
    }
    
    const grid = data.history[currentStep].grid;
    
    if (currentView === 'heatmap') {
        createHeatmapView(vizContainer, data, grid);
    } else {
        createGridView(vizContainer, data, grid);
    }
}

// Create grid view with zoom support
function createGridView(vizContainer, data, grid) {
    // Clear container
    vizContainer.innerHTML = '';
    
    // Create wrapper for zoom
    const zoomWrapper = document.createElement('div');
    zoomWrapper.style.cssText = 'width: 100%; height: 100%; overflow: hidden; position: relative; background: linear-gradient(135deg, #2E3A34 0%, #1F2823 100%); border-radius: 8px;';
    zoomWrapper.id = 'evolution-grid-zoom-wrapper';
    
    // Create grid container with initial scale
    const gridContainer = document.createElement('div');
    gridContainer.id = 'evolution-grid-container';
    gridContainer.style.cssText = `display: grid; gap: 2px; padding: 1rem; border-radius: 4px; transform-origin: center center; transition: transform 0.1s ease-out;`;
    gridContainer.style.gridTemplateColumns = `repeat(${data.grid_size}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${data.grid_size}, 1fr)`;
    
    // Calculate cell size to fit container
    const containerWidth = vizContainer.clientWidth || 800;
    const containerHeight = vizContainer.clientHeight || 600;
    const availableWidth = containerWidth - 32; // padding
    const availableHeight = containerHeight - 32;
    const cellSize = Math.min(availableWidth / data.grid_size, availableHeight / data.grid_size);
    
    // Set initial size
    const totalSize = cellSize * data.grid_size;
    gridContainer.style.width = `${totalSize}px`;
    gridContainer.style.height = `${totalSize}px`;
    gridContainer.style.minWidth = `${totalSize}px`;
    gridContainer.style.minHeight = `${totalSize}px`;
    
    // Create cells
    for (let i = 0; i < data.grid_size; i++) {
        for (let j = 0; j < data.grid_size; j++) {
            const cell = document.createElement('div');
            cell.style.cssText = `width: ${cellSize}px; height: ${cellSize}px; border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.2s ease; cursor: pointer;`;
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.dataset.state = grid[i][j];
            
            // Set cell color based on state
            switch (grid[i][j]) {
                case 0: // Normal
                    cell.style.backgroundColor = '#ecf0f1';
                    break;
                case 1: // Mutated
                    cell.style.backgroundColor = '#e74c3c';
                    break;
                case 2: // Resistant
                    cell.style.backgroundColor = '#2ecc71';
                    break;
            }
            
            // Add hover effect
            cell.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.1)';
                this.style.zIndex = '10';
                this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
                const neighbors = countNeighbors(grid, i, j, data.grid_size);
                this.title = `Position: (${i}, ${j})\nState: ${grid[i][j] === 0 ? 'Normal' : grid[i][j] === 1 ? 'Mutated' : 'Resistant'}\nMutated neighbors: ${neighbors.mutated}\nResistant neighbors: ${neighbors.resistant}`;
            });
            
            cell.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
                this.style.zIndex = '1';
                this.style.boxShadow = 'none';
            });
            
            gridContainer.appendChild(cell);
        }
    }
    
    // Add zoom functionality
    let currentScale = 1;
    let isPanning = false;
    let startX, startY, scrollLeft, scrollTop;
    
    // Mouse wheel zoom
    zoomWrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        currentScale = Math.max(0.5, Math.min(3, currentScale * delta));
        gridContainer.style.transform = `scale(${currentScale})`;
    });
    
    // Pan with mouse drag
    zoomWrapper.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left mouse button
            isPanning = true;
            startX = e.pageX - zoomWrapper.offsetLeft;
            startY = e.pageY - zoomWrapper.offsetTop;
            scrollLeft = gridContainer.scrollLeft;
            scrollTop = gridContainer.scrollTop;
            zoomWrapper.style.cursor = 'grabbing';
        }
    });
    
    zoomWrapper.addEventListener('mouseleave', () => {
        isPanning = false;
        zoomWrapper.style.cursor = 'default';
    });
    
    zoomWrapper.addEventListener('mouseup', () => {
        isPanning = false;
        zoomWrapper.style.cursor = 'default';
    });
    
    zoomWrapper.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        e.preventDefault();
        const x = e.pageX - zoomWrapper.offsetLeft;
        const y = e.pageY - zoomWrapper.offsetTop;
        const walkX = (x - startX) * 0.5;
        const walkY = (y - startY) * 0.5;
        gridContainer.style.transform = `scale(${currentScale}) translate(${walkX / currentScale}px, ${walkY / currentScale}px)`;
    });
    
    // Center the grid
    zoomWrapper.style.display = 'flex';
    zoomWrapper.style.alignItems = 'center';
    zoomWrapper.style.justifyContent = 'center';
    
    zoomWrapper.appendChild(gridContainer);
    vizContainer.appendChild(zoomWrapper);
}

// Create heatmap view with zoom support
function createHeatmapView(vizContainer, data, grid) {
    // Calculate local mutation density
    const density = Array(data.grid_size).fill(null).map(() => Array(data.grid_size).fill(0));
    
    for (let i = 0; i < data.grid_size; i++) {
        for (let j = 0; j < data.grid_size; j++) {
            let mutatedNeighbors = 0;
            let totalNeighbors = 0;
            
            for (let di = -1; di <= 1; di++) {
                for (let dj = -1; dj <= 1; dj++) {
                    if (di === 0 && dj === 0) continue;
                    const ni = i + di;
                    const nj = j + dj;
                    if (ni >= 0 && ni < data.grid_size && nj >= 0 && nj < data.grid_size) {
                        totalNeighbors++;
                        if (grid[ni][nj] === 1) mutatedNeighbors++;
                    }
                }
            }
            
            density[i][j] = totalNeighbors > 0 ? mutatedNeighbors / totalNeighbors : 0;
        }
    }
    
    // Create wrapper for zoom
    const zoomWrapper = document.createElement('div');
    zoomWrapper.style.cssText = 'width: 100%; height: 100%; overflow: hidden; position: relative; background: linear-gradient(135deg, #2E3A34 0%, #1F2823 100%); border-radius: 8px;';
    
    const gridContainer = document.createElement('div');
    gridContainer.id = 'evolution-heatmap-container';
    gridContainer.style.cssText = `display: grid; gap: 2px; padding: 1rem; border-radius: 4px; transform-origin: center center; transition: transform 0.1s ease-out;`;
    gridContainer.style.gridTemplateColumns = `repeat(${data.grid_size}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${data.grid_size}, 1fr)`;
    
    // Calculate cell size
    const containerWidth = vizContainer.clientWidth || 800;
    const containerHeight = vizContainer.clientHeight || 600;
    const availableWidth = containerWidth - 32;
    const availableHeight = containerHeight - 32;
    const cellSize = Math.min(availableWidth / data.grid_size, availableHeight / data.grid_size);
    const totalSize = cellSize * data.grid_size;
    gridContainer.style.width = `${totalSize}px`;
    gridContainer.style.height = `${totalSize}px`;
    gridContainer.style.minWidth = `${totalSize}px`;
    gridContainer.style.minHeight = `${totalSize}px`;
    
    for (let i = 0; i < data.grid_size; i++) {
        for (let j = 0; j < data.grid_size; j++) {
            const cell = document.createElement('div');
            const intensity = density[i][j];
            const hue = 0;
            const saturation = Math.min(100, intensity * 100);
            const lightness = 90 - (intensity * 40);
            cell.style.cssText = `width: ${cellSize}px; height: ${cellSize}px; border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.2s ease; cursor: pointer; background-color: hsl(${hue}, ${saturation}%, ${lightness}%);`;
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.title = `Mutation density: ${(intensity * 100).toFixed(1)}%`;
            
            cell.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.1)';
                this.style.zIndex = '10';
                this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
            });
            
            cell.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
                this.style.zIndex = '1';
                this.style.boxShadow = 'none';
            });
            
            gridContainer.appendChild(cell);
        }
    }
    
    // Add zoom functionality (same as grid view)
    let currentScale = 1;
    let isPanning = false;
    let startX, startY;
    
    zoomWrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        currentScale = Math.max(0.5, Math.min(3, currentScale * delta));
        gridContainer.style.transform = `scale(${currentScale})`;
    });
    
    zoomWrapper.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            isPanning = true;
            startX = e.pageX - zoomWrapper.offsetLeft;
            startY = e.pageY - zoomWrapper.offsetTop;
            zoomWrapper.style.cursor = 'grabbing';
        }
    });
    
    zoomWrapper.addEventListener('mouseleave', () => {
        isPanning = false;
        zoomWrapper.style.cursor = 'default';
    });
    
    zoomWrapper.addEventListener('mouseup', () => {
        isPanning = false;
        zoomWrapper.style.cursor = 'default';
    });
    
    zoomWrapper.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        e.preventDefault();
        const x = e.pageX - zoomWrapper.offsetLeft;
        const y = e.pageY - zoomWrapper.offsetTop;
        const walkX = (x - startX) * 0.5;
        const walkY = (y - startY) * 0.5;
        gridContainer.style.transform = `scale(${currentScale}) translate(${walkX / currentScale}px, ${walkY / currentScale}px)`;
    });
    
    zoomWrapper.style.display = 'flex';
    zoomWrapper.style.alignItems = 'center';
    zoomWrapper.style.justifyContent = 'center';
    
    zoomWrapper.appendChild(gridContainer);
    vizContainer.appendChild(zoomWrapper);
}

// Count neighbors
function countNeighbors(grid, row, col, gridSize) {
    let mutated = 0, resistant = 0;
    
    for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
            if (di === 0 && dj === 0) continue;
            const ni = row + di;
            const nj = col + dj;
            if (ni >= 0 && ni < gridSize && nj >= 0 && nj < gridSize) {
                if (grid[ni][nj] === 1) mutated++;
                if (grid[ni][nj] === 2) resistant++;
            }
        }
    }
    
    return {mutated, resistant};
}

// Update growth chart
function updateGrowthChart() {
    const chartContainer = document.getElementById('evolution-growth-chart');
    if (!chartContainer) return;
    
    // Hide chart if no data (completely remove from layout)
    if (growthData.length === 0) {
        chartContainer.style.cssText = 'display: none !important; height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; visibility: hidden !important;';
        return;
    }
    
    // Show chart when there's data
    chartContainer.style.cssText = 'display: block; height: 180px; margin-top: 0.75rem; padding: 0.75rem; overflow: visible; visibility: visible; background: linear-gradient(135deg, var(--bg-panel) 0%, #2E3A34 100%); border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); border: 1px solid rgba(162, 123, 92, 0.15);';
    chartContainer.innerHTML = '';
    
    const width = chartContainer.clientWidth - 40;
    const height = 120;
    const margin = {top: 10, right: 10, bottom: 30, left: 40};
    
    const svg = d3.select(chartContainer)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(growthData, d => d.step)])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(growthData, d => d.normal + d.mutated + d.resistant)])
        .range([height, 0]);
    
    // Create line generators
    const normalLine = d3.line()
        .x(d => xScale(d.step))
        .y(d => yScale(d.normal))
        .curve(d3.curveMonotoneX);
    
    const mutatedLine = d3.line()
        .x(d => xScale(d.step))
        .y(d => yScale(d.mutated))
        .curve(d3.curveMonotoneX);
    
    const resistantLine = d3.line()
        .x(d => xScale(d.step))
        .y(d => yScale(d.resistant))
        .curve(d3.curveMonotoneX);
    
    // Add axes
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .append('text')
        .attr('x', width / 2)
        .attr('y', 25)
        .attr('fill', '#666')
        .style('text-anchor', 'middle')
        .text('Step');
    
    g.append('g')
        .call(d3.axisLeft(yScale))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -30)
        .attr('fill', '#666')
        .style('text-anchor', 'middle')
        .text('Count');
    
    // Add lines
    g.append('path')
        .datum(growthData)
        .attr('fill', 'none')
        .attr('stroke', '#ecf0f1')
        .attr('stroke-width', 2)
        .attr('d', normalLine);
    
    g.append('path')
        .datum(growthData)
        .attr('fill', 'none')
        .attr('stroke', '#e74c3c')
        .attr('stroke-width', 2)
        .attr('d', mutatedLine);
    
    g.append('path')
        .datum(growthData)
        .attr('fill', 'none')
        .attr('stroke', '#2ecc71')
        .attr('stroke-width', 2)
        .attr('d', resistantLine);
    
    // Add legend
    const legend = g.append('g')
        .attr('transform', `translate(${width - 150}, 10)`);
    
    const legendData = [
        {color: '#ecf0f1', label: 'Normal'},
        {color: '#e74c3c', label: 'Mutated'},
        {color: '#2ecc71', label: 'Resistant'}
    ];
    
    legendData.forEach((item, i) => {
        const legendItem = legend.append('g')
            .attr('transform', `translate(0, ${i * 20})`);
        
        legendItem.append('line')
            .attr('x1', 0)
            .attr('x2', 20)
            .attr('y1', 0)
            .attr('y2', 0)
            .attr('stroke', item.color)
            .attr('stroke-width', 2);
        
        legendItem.append('text')
            .attr('x', 25)
            .attr('y', 4)
            .attr('fill', '#666')
            .style('font-size', '12px')
            .text(item.label);
    });
}

// Update 3D visualization
function update3DVisualization(data) {
    if (!mutationVisualization) return;
    
    if (!data.history || data.history.length === 0) return;
    
    // Set the data for the 3D visualization
    mutationVisualization.setData(data.grid_size, data.history);
    mutationVisualization.goToStep(currentStep);
}

// Play simulation
function playSimulation() {
    if (!evolutionData || isPlaying) return;
    
    isPlaying = true;
    
    const playBtn = document.getElementById('evolution-play');
    const pauseBtn = document.getElementById('evolution-pause');
    
    if (playBtn) playBtn.disabled = true;
    if (pauseBtn) pauseBtn.disabled = false;
    
    // Start animation interval with configurable speed
    playInterval = setInterval(() => {
        if (currentStep < evolutionData.history.length - 1) {
            stepSimulation();
        } else {
            pauseSimulation();
        }
    }, animationSpeed);
}

// Pause simulation
function pauseSimulation() {
    isPlaying = false;
    
    const playBtn = document.getElementById('evolution-play');
    const pauseBtn = document.getElementById('evolution-pause');
    
    if (playBtn) playBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
    
    // Clear animation interval
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
    }
}

// Step simulation
function stepSimulation() {
    if (!evolutionData) return;
    
    if (currentStep < evolutionData.history.length - 1) {
        goToStep(currentStep + 1);
    }
}

// Go to specific step
function goToStep(step) {
    if (!evolutionData || step < 0 || step >= evolutionData.history.length) return;
    
    currentStep = step;
    
    const stepCounter = document.getElementById('evolution-step-counter');
    const stepSlider = document.getElementById('evolution-step-slider');
    
    if (stepCounter) stepCounter.textContent = currentStep;
    if (stepSlider) stepSlider.value = currentStep;
    
    // Update real-time statistics
    updateRealTimeStats(evolutionData);
    
    // Update 2D visualization
    update2DVisualization(evolutionData);
    
    // Update growth chart
    updateGrowthChart();
    
    // Update 3D visualization
    if (mutationVisualization) {
        mutationVisualization.goToStep(currentStep);
    }
}