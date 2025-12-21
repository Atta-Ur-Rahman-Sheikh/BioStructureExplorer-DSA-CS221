// Three.js Utilities for BioStructure Explorer - Simplified Version

// Import Three.js library
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/jsm/controls/OrbitControls.js';

// Base class for all 3D visualizations
class BaseVisualization {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Container not found:', containerId);
            return;
        }
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.objects = [];
        this.isAnimating = false;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);
        
        // Create camera
        const width = this.container.clientWidth || 800;
        const height = this.container.clientHeight || 500;
        
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.z = 50;
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
        this.container.appendChild(this.renderer.domElement);
        
        // Create controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        // Handle window resize
        this.resizeHandler = () => this.onWindowResize();
        window.addEventListener('resize', this.resizeHandler);
        
        // Start animation
        this.animate();
    }
    
    onWindowResize() {
        if (!this.container) return;
        
        const width = this.container.clientWidth || 800;
        const height = this.container.clientHeight || 500;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    animate() {
        this.isAnimating = true;
        this.render();
    }
    
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    render() {
        if (!this.isAnimating || !this.renderer) return;
        
        this.animationId = requestAnimationFrame(() => this.render());
        
        if (this.controls) {
            this.controls.update();
        }
        
        this.update();
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    update() {
        // Override in subclasses
    }
    
    clear() {
        // Remove all objects from the scene (except lights and camera)
        const objectsToRemove = [];
        this.scene.traverse((object) => {
            if (object !== this.camera && object.type !== 'AmbientLight' && object.type !== 'DirectionalLight') {
                objectsToRemove.push(object);
            }
        });
        
        objectsToRemove.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
            this.scene.remove(obj);
        });
        
        this.objects = [];
    }
    
    dispose() {
        this.stopAnimation();
        
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        
        if (this.controls) {
            this.controls.dispose();
        }
        
        this.clear();
        
        if (this.renderer && this.container) {
            if (this.renderer.domElement.parentNode === this.container) {
                this.container.removeChild(this.renderer.domElement);
            }
            this.renderer.dispose();
        }
    }
    
    // Create a simple sphere
    createSphere(radius, color, position) {
        const geometry = new THREE.SphereGeometry(radius, 16, 16); // Reduced segments for performance
        const material = new THREE.MeshLambertMaterial({ color });
        const sphere = new THREE.Mesh(geometry, material);
        
        if (position) {
            sphere.position.copy(position);
        }
        
        return sphere;
    }
    
    // Create a cylinder between two points
    createCylinder(startPoint, endPoint, radius) {
        const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
        const height = direction.length();
        
        if (height === 0) return null;
        
        const geometry = new THREE.CylinderGeometry(radius, radius, height, 8); // Reduced segments
        const material = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        
        const cylinder = new THREE.Mesh(geometry, material);
        cylinder.position.copy(startPoint);
        
        // Orient the cylinder
        const axis = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction.normalize());
        cylinder.applyQuaternion(quaternion);
        cylinder.translateY(height / 2);
        
        return cylinder;
    }
}

// DNA Visualization class - Simplified
class DNAVisualization extends BaseVisualization {
    constructor(containerId) {
        super(containerId);
        this.dnaSequence = '';
        this.matches = [];
        this.baseColors = {
            'A': 0x00ff00, // Green
            'T': 0xff0000, // Red
            'G': 0x0000ff, // Blue
            'C': 0xffff00  // Yellow
        };
        this.matchColor = 0xff00ff; // Magenta
        this.helixRadius = 5;
        this.basesPerTurn = 10;
        this.helixRise = 2;
    }
    
    setData(dnaSequence, matches = []) {
        this.dnaSequence = dnaSequence;
        this.matches = matches;
        
        this.clear();
        this.createDNAHelix();
        this.centerCamera();
    }
    
    createDNAHelix() {
        if (!this.dnaSequence) return;
        
        const length = Math.min(this.dnaSequence.length, 200); // Limit length for performance
        const matchSet = new Set(this.matches);
        
        // Create simplified DNA representation
        for (let i = 0; i < length; i += 5) { // Sample every 5th base for performance
            const base = this.dnaSequence[i];
            const angle = (i / this.basesPerTurn) * Math.PI * 2;
            const height = i * this.helixRise / this.basesPerTurn;
            
            const x = Math.cos(angle) * this.helixRadius;
            const z = Math.sin(angle) * this.helixRadius;
            const y = height;
            
            const isMatch = matchSet.has(i);
            const baseColor = isMatch ? this.matchColor : (this.baseColors[base] || 0x808080);
            
            const baseSphere = this.createSphere(0.3, baseColor, new THREE.Vector3(x, y, z));
            this.scene.add(baseSphere);
            this.objects.push(baseSphere);
        }
    }
    
    centerCamera() {
        if (!this.dnaSequence) return;
        
        const length = Math.min(this.dnaSequence.length, 200);
        const height = length * this.helixRise / this.basesPerTurn;
        
        this.camera.position.set(this.helixRadius * 2, height / 2, this.helixRadius * 2);
        this.camera.lookAt(0, height / 2, 0);
        if (this.controls) {
            this.controls.target.set(0, height / 2, 0);
            this.controls.update();
        }
    }
}

// Graph Visualization class - Simplified
class GraphVisualization extends BaseVisualization {
    constructor(containerId) {
        super(containerId);
        this.nodes = [];
        this.edges = [];
        this.nodeObjects = new Map();
    }
    
    setData(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
        
        this.clear();
        this.createGraph();
        this.centerCamera();
    }
    
    createGraph() {
        if (!this.nodes || !this.edges) return;
        
        // Limit nodes for performance
        const maxNodes = 50;
        const displayNodes = this.nodes.slice(0, maxNodes);
        const displayEdges = this.edges.filter(e => 
            displayNodes.some(n => n.id === e.source) && 
            displayNodes.some(n => n.id === e.target)
        );
        
        // Create nodes
        const nodePositions = new Map();
        const graphSize = 20;
        
        displayNodes.forEach((node, index) => {
            // Simple circular layout
            const angle = (index / displayNodes.length) * Math.PI * 2;
            const radius = graphSize * (0.5 + node.centrality);
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (Math.random() - 0.5) * 5;
            
            const position = new THREE.Vector3(x, y, z);
            nodePositions.set(node.id, position);
            
            const size = 0.5 + node.centrality * 2;
            const nodeSphere = this.createSphere(size, 0x3498db, position);
            this.scene.add(nodeSphere);
            this.nodeObjects.set(node.id, nodeSphere);
            this.objects.push(nodeSphere);
        });
        
        // Create edges
        displayEdges.forEach(edge => {
            const sourcePos = nodePositions.get(edge.source);
            const targetPos = nodePositions.get(edge.target);
            
            if (sourcePos && targetPos) {
                const edgeCylinder = this.createCylinder(sourcePos, targetPos, 0.1);
                if (edgeCylinder) {
                    this.scene.add(edgeCylinder);
                    this.objects.push(edgeCylinder);
                }
            }
        });
    }
    
    centerCamera() {
        this.camera.position.set(0, 0, 40);
        if (this.controls) {
            this.controls.update();
        }
    }
}

// Mutation Simulator Visualization class - Simplified
class MutationVisualization extends BaseVisualization {
    constructor(containerId) {
        super(containerId);
        this.gridSize = 0;
        this.cellStates = [];
        this.history = [];
        this.currentStep = 0;
        this.cellSize = 0.8;
        this.cellSpacing = 0.1;
        this.cellColors = {
            0: 0xecf0f1, // Normal - Light gray
            1: 0xe74c3c, // Mutated - Red
            2: 0x2ecc71  // Resistant - Green
        };
    }
    
    setData(gridSize, history) {
        this.gridSize = Math.min(gridSize, 20); // Limit grid size for performance
        this.history = history;
        this.currentStep = 0;
        
        this.clear();
        this.createGrid();
        this.centerCamera();
    }
    
    createGrid() {
        if (!this.gridSize || !this.history || this.history.length === 0) return;
        
        const grid = this.history[this.currentStep].grid;
        const totalSize = this.gridSize * (this.cellSize + this.cellSpacing);
        const offset = totalSize / 2;
        
        this.cellStates = [];
        
        for (let i = 0; i < this.gridSize; i++) {
            this.cellStates[i] = [];
            
            for (let j = 0; j < this.gridSize; j++) {
                const x = i * (this.cellSize + this.cellSpacing) - offset;
                const z = j * (this.cellSize + this.cellSpacing) - offset;
                const y = 0;
                
                const state = grid[i][j];
                
                const geometry = new THREE.BoxGeometry(this.cellSize, this.cellSize, this.cellSize);
                const material = new THREE.MeshLambertMaterial({ color: this.cellColors[state] });
                const cell = new THREE.Mesh(geometry, material);
                
                cell.position.set(x, y, z);
                cell.userData = { row: i, col: j, state };
                
                this.scene.add(cell);
                this.cellStates[i][j] = cell;
                this.objects.push(cell);
            }
        }
    }
    
    updateGrid(step) {
        if (!this.history || step >= this.history.length) return;
        
        this.currentStep = step;
        const grid = this.history[step].grid;
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const cell = this.cellStates[i] && this.cellStates[i][j];
                const newState = grid[i][j];
                
                if (cell && cell.userData.state !== newState) {
                    cell.userData.state = newState;
                    cell.material.color.setHex(this.cellColors[newState]);
                }
            }
        }
    }
    
    goToStep(step) {
        if (step >= 0 && step < this.history.length) {
            this.updateGrid(step);
        }
    }
    
    centerCamera() {
        const totalSize = this.gridSize * (this.cellSize + this.cellSpacing);
        this.camera.position.set(totalSize, totalSize, totalSize);
        this.camera.lookAt(0, 0, 0);
        if (this.controls) {
            this.controls.update();
        }
    }
}

// Export the visualization classes
export { BaseVisualization, DNAVisualization, GraphVisualization, MutationVisualization };