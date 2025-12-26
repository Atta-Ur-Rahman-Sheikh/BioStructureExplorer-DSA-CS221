// Protein Structure Visualization

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Protein visualization
    initProteinVisualization();
    
    // Automatically load sample data
    loadSampleProteinData();
});

// Global variables
let proteinData = null;
let viewer = null;
let availableChains = [];
let selectedChains = new Set();

// Initialize Protein visualization
function initProteinVisualization() {
    // Set up event listeners
    const fileInput = document.getElementById('protein-file');
    if (fileInput) {
        fileInput.addEventListener('change', handleProteinFileUpload);
    }
    
    // Set up sample PDB selector
    const sampleSelect = document.getElementById('protein-sample-select');
    if (sampleSelect) {
        sampleSelect.addEventListener('change', async (e) => {
            const fileName = e.target.value;
            if (fileName) {
                try {
                    const response = await fetch(`../data/${fileName}`);
                    if (response.ok) {
                        const pdbText = await response.text();
                        const data = parsePDBFile(pdbText);
                        proteinData = data;
                        // Pass PDB text for direct loading
                        updateProteinVisualization(data, pdbText);
                    } else {
                        alert(`Could not load ${fileName}. Please check if the file exists.`);
                    }
                } catch (error) {
                    console.error('Error loading sample PDB:', error);
                    alert(`Error loading ${fileName}: ${error.message}`);
                }
            }
        });
    }
    
    // Set up style selector
    const styleSelector = document.getElementById('protein-style');
    if (styleSelector) {
        styleSelector.addEventListener('change', updateVisualizationStyle);
    }
    
    // Set up color-by selector
    const colorBySelector = document.getElementById('protein-color-by');
    if (colorBySelector) {
        colorBySelector.addEventListener('change', () => {
            if (proteinData && currentPDBText) {
                update3DVisualization(proteinData, currentPDBText);
            } else if (proteinData) {
                update3DVisualization(proteinData);
            }
        });
    }
    
    // Update chain selector visibility based on color-by selection
    if (colorBySelector) {
        colorBySelector.addEventListener('change', () => {
            const chainSelector = document.getElementById('protein-chain-selector');
            if (chainSelector && colorBySelector.value === 'chain') {
                chainSelector.style.display = 'block';
            }
        });
    }
    
    // Initialize 3Dmol.js viewer with retry logic
    initialize3DmolViewer();
}

// Initialize 3Dmol.js viewer with retry logic
function initialize3DmolViewer(retries = 10) {
    const vizContainer = document.getElementById('protein-viz');
    if (!vizContainer) {
        console.error('Protein visualization container not found');
        return;
    }
    
    // Ensure container has dimensions
    if (vizContainer.offsetWidth === 0 || vizContainer.offsetHeight === 0) {
        // Wait for layout
        if (retries > 0) {
            setTimeout(() => initialize3DmolViewer(retries - 1), 100);
        }
        return;
    }
    
    // Check if 3Dmol.js is available
    if (typeof $3Dmol !== 'undefined') {
        try {
            viewer = $3Dmol.createViewer(vizContainer, {
                backgroundColor: 0x1F2823, // Dark background to match theme
                antialias: true,
                outline: true
            });
            
            // Set viewer size explicitly
            if (viewer.setBackgroundColor) {
                viewer.setBackgroundColor(0x1F2823);
            }
            
            // If we have data, update visualization
            if (proteinData) {
                if (currentPDBText) {
                    update3DVisualization(proteinData, currentPDBText);
                } else {
                    update3DVisualization(proteinData);
                }
            }
            
            console.log('3Dmol.js viewer initialized successfully');
        } catch (err) {
            console.error('Error creating 3Dmol.js viewer:', err);
            vizContainer.innerHTML = '<p style="padding: 2rem; text-align: center; color: #DCD7C9;">Error initializing 3D viewer. Please refresh the page.</p>';
        }
    } else if (retries > 0) {
        // Retry after a short delay
        setTimeout(() => initialize3DmolViewer(retries - 1), 200);
    } else {
        console.error('3Dmol.js library not loaded after retries');
        vizContainer.innerHTML = '<p style="padding: 2rem; text-align: center; color: #DCD7C9;">3Dmol.js library failed to load. Please refresh the page.</p>';
    }
}

// Load sample protein data automatically
async function loadSampleProteinData() {
    // Try to load first available sample PDB file first (preferred)
    const sampleFiles = ['1LYZ.pdb', '1A3N.pdb', '1GFL.pdb', '4INS.pdb'];
    for (const fileName of sampleFiles) {
        try {
            const response = await fetch(`../data/${fileName}`);
            if (response.ok) {
                const pdbText = await response.text();
                const data = parsePDBFile(pdbText);
                if (data && data.atoms && data.atoms.length > 0) {
                    proteinData = data;
                    currentPDBText = pdbText;
                    // Update the dropdown to show which file was loaded
                    const sampleSelect = document.getElementById('protein-sample-select');
                    if (sampleSelect) {
                        sampleSelect.value = fileName;
                    }
                    // Wait for viewer to be ready before updating
                    waitForViewerAndUpdate(data, pdbText);
                    console.log(`Loaded sample PDB file: ${fileName}`);
                    return;
                }
            }
        } catch (error) {
            console.log(`Could not load ${fileName}, trying next file...`);
            continue;
        }
    }
    
    // Try to load from JSON file
    try {
        const data = await fetchJSON('../output/protein_structure.json');
        if (data && data.atoms && data.atoms.length > 0) {
            proteinData = data;
            waitForViewerAndUpdate(data);
            return;
        }
    } catch (error) {
        console.log('Could not load JSON file');
    }
    
    // Fallback to default data
    const defaultData = createDefaultProteinData();
    proteinData = defaultData;
    waitForViewerAndUpdate(defaultData);
    console.log('Using default protein data');
}

// Wait for viewer to be ready and then update
function waitForViewerAndUpdate(data, pdbText = null) {
    const checkViewer = setInterval(() => {
        if (viewer) {
            clearInterval(checkViewer);
            updateProteinVisualization(data, pdbText);
        } else if (typeof $3Dmol !== 'undefined') {
            // Try to initialize if 3Dmol is available but viewer isn't
            initialize3DmolViewer();
        }
    }, 100);
    
    // Timeout after 5 seconds
    setTimeout(() => {
        clearInterval(checkViewer);
        if (viewer) {
            updateProteinVisualization(data, pdbText);
        }
    }, 5000);
}

// Create default protein data
function createDefaultProteinData() {
    // Create a simple helix structure
    const atoms = [];
    let serial = 1;
    
    for (let i = 0; i < 20; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const x = Math.cos(angle) * 5;
        const y = i * 1.5;
        const z = Math.sin(angle) * 5;
        
        atoms.push({
            serial: serial++,
            name: "CA",
            element: "C",
            residue: "ALA",
            residue_seq: Math.floor(i / 2) + 1,
            chain: "A",
            x: x,
            y: y,
            z: z
        });
    }
    
    return {
        pdb_id: "sample",
        atom_count: atoms.length,
        chains: [{id: "A", atom_count: atoms.length}],
        atoms: atoms
    };
}

// Parse PDB file
function parsePDBFile(pdbText) {
    const lines = pdbText.split('\n');
    const atoms = [];
    const chainCounts = {};
    let pdbId = 'unknown';
    
    // Extract PDB ID from HEADER record (format: HEADER ... PDBID)
    for (const line of lines) {
        if (line.startsWith('HEADER')) {
            // PDB ID is typically at the end of the HEADER line (last 4 characters after date)
            // Format: HEADER    CLASS                          DD-MMM-YY   PDBID
            const trimmed = line.trim();
            if (trimmed.length >= 4) {
                // Try to extract from end
                const parts = trimmed.split(/\s+/);
                if (parts.length > 0) {
                    // Last part should be the PDB ID
                    const lastPart = parts[parts.length - 1];
                    if (lastPart && lastPart.length === 4) {
                        pdbId = lastPart;
                    }
                }
            }
        }
    }
    
    // Parse ATOM and HETATM records
    for (const line of lines) {
        if (line.startsWith('ATOM ') || line.startsWith('HETATM')) {
            if (line.length < 54) continue;
            
            try {
                // Parse according to PDB format specification
                // Columns:  0-5: Record type, 6-10: Serial, 12-15: Atom name, 
                //          17-19: Residue name, 21: Chain, 22-25: Residue seq,
                //          30-37: X, 38-45: Y, 46-53: Z, 76-77: Element
                const serial = parseInt(line.substring(6, 11).trim()) || 0;
                const name = line.substring(12, 16).trim();
                const residue = line.substring(17, 20).trim();
                const chain = line.substring(21, 22).trim() || 'A';
                const residueSeqStr = line.substring(22, 26).trim();
                const residueSeq = parseInt(residueSeqStr) || 0;
                
                // Parse coordinates (allow for negative values)
                const xStr = line.substring(30, 38).trim();
                const yStr = line.substring(38, 46).trim();
                const zStr = line.substring(46, 54).trim();
                const x = parseFloat(xStr) || 0;
                const y = parseFloat(yStr) || 0;
                const z = parseFloat(zStr) || 0;
                
                // Extract element (column 76-77, or infer from atom name)
                let element = '';
                if (line.length >= 78) {
                    element = line.substring(76, 78).trim();
                }
                if (!element || element.length === 0) {
                    // Infer element from atom name
                    // Atom names like " CA " or "N  " - element is usually first non-space char
                    const nameTrimmed = name.trim();
                    if (nameTrimmed.length > 0) {
                        // First character is usually the element
                        element = nameTrimmed.charAt(0);
                        // For two-letter elements, check if second char is also a letter
                        if (nameTrimmed.length > 1 && /[A-Z]/.test(nameTrimmed.charAt(1))) {
                            element = nameTrimmed.substring(0, 2);
                        }
                    }
                }
                // Default to C if still empty
                if (!element || element.length === 0) {
                    element = 'C';
                }
                
                // Only add valid atoms
                if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                    atoms.push({
                        serial: serial,
                        name: name,
                        element: element,
                        residue: residue,
                        residue_seq: residueSeq,
                        chain: chain,
                        x: x,
                        y: y,
                        z: z
                    });
                    
                    if (!chainCounts[chain]) {
                        chainCounts[chain] = 0;
                    }
                    chainCounts[chain]++;
                }
            } catch (err) {
                console.warn('Error parsing atom record:', line.substring(0, 80), err);
            }
        }
    }
    
    const chains = Object.keys(chainCounts).sort().map(id => ({
        id: id,
        atom_count: chainCounts[id]
    }));
    
    return {
        pdb_id: pdbId,
        atom_count: atoms.length,
        chains: chains,
        atoms: atoms
    };
}

// Handle protein file upload
function handleProteinFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const fileContent = e.target.result;
        const fileName = file.name.toLowerCase();
        
        let data = null;
        
        if (fileName.endsWith('.pdb')) {
            // Parse PDB file
            try {
                data = parsePDBFile(fileContent);
                proteinData = data;
                // Pass PDB text for direct loading
                updateProteinVisualization(data, fileContent);
            } catch (error) {
                console.error('Error parsing PDB file:', error);
                alert('Error parsing PDB file. Please check the file format.');
            }
        } else if (fileName.endsWith('.json')) {
            // Parse JSON file
            try {
                data = JSON.parse(fileContent);
                proteinData = data;
                updateProteinVisualization(data);
            } catch (error) {
                console.error('Error parsing protein JSON:', error);
                alert('Invalid JSON file format');
            }
        } else {
            alert('Unsupported file format. Please upload a .pdb or .json file.');
        }
    };
    reader.readAsText(file);
}

// Update protein visualization
function updateProteinVisualization(data, pdbText = null) {
    if (!data || !data.atoms || data.atoms.length === 0) {
        console.error('Invalid protein data format');
        const vizContainer = document.getElementById('protein-viz');
        if (vizContainer) {
            vizContainer.innerHTML = '<p style="padding: 2rem; text-align: center; color: #DCD7C9;">No protein data available</p>';
        }
        return;
    }
    
    // Store PDB text if provided
    if (pdbText) {
        currentPDBText = pdbText;
    }
    
    // Update stats
    const pdbIdEl = document.getElementById('protein-pdb-id');
    const atomCountEl = document.getElementById('protein-atom-count');
    const chainsEl = document.getElementById('protein-chains');
    
    if (pdbIdEl) pdbIdEl.textContent = data.pdb_id || '-';
    if (atomCountEl) atomCountEl.textContent = data.atom_count || '-';
    
    // Update chains
    const chains = data.chains || [];
    if (chainsEl) chainsEl.textContent = chains.length;
    
    // Update chain selector
    updateChainSelector(chains);
    
    // Update 3D visualization (pass PDB text if available for direct loading)
    update3DVisualization(data, pdbText);
}

// Update chain selector
function updateChainSelector(chains) {
    const chainSelector = document.getElementById('protein-chain-selector');
    const chainCheckboxes = document.getElementById('protein-chain-checkboxes');
    
    if (!chainSelector || !chainCheckboxes) return;
    
    availableChains = chains.map(c => c.id);
    selectedChains = new Set(availableChains); // Select all by default
    
    if (chains.length > 1) {
        chainSelector.style.display = 'block';
        chainCheckboxes.innerHTML = '';
        
        chains.forEach(chain => {
            const label = document.createElement('label');
            label.style.cssText = 'display: flex; align-items: center; gap: 0.3rem; cursor: pointer;';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = chain.id;
            checkbox.checked = true;
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    selectedChains.add(chain.id);
                } else {
                    selectedChains.delete(chain.id);
                }
                if (proteinData && currentPDBText) {
                    update3DVisualization(proteinData, currentPDBText);
                } else if (proteinData) {
                    update3DVisualization(proteinData);
                }
            });
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(`Chain ${chain.id} (${chain.atom_count} atoms)`));
            chainCheckboxes.appendChild(label);
        });
    } else {
        chainSelector.style.display = 'none';
    }
}

// Store original PDB text for direct loading
let currentPDBText = null;

// Update 3D visualization
function update3DVisualization(data, pdbText = null) {
    // Ensure viewer is initialized
    if (!viewer) {
        const vizContainer = document.getElementById('protein-viz');
        if (!vizContainer) {
            console.error('Protein visualization container not found');
            return;
        }
        
        // Check if container has dimensions
        if (vizContainer.offsetWidth === 0 || vizContainer.offsetHeight === 0) {
            // Wait for layout and retry
            setTimeout(() => update3DVisualization(data, pdbText), 100);
            return;
        }
        
        if (typeof $3Dmol !== 'undefined') {
            try {
                viewer = $3Dmol.createViewer(vizContainer, {
                    backgroundColor: 0x1F2823, // Dark background
                    antialias: true,
                    outline: true
                });
                if (viewer && viewer.setBackgroundColor) {
                    viewer.setBackgroundColor(0x1F2823);
                }
                console.log('3Dmol.js viewer created in update3DVisualization');
            } catch (err) {
                console.error('Error creating viewer:', err);
                return;
            }
        } else {
            // Try to initialize with retry
            initialize3DmolViewer(5);
            // Wait a bit and try again
            setTimeout(() => {
                if (viewer) {
                    update3DVisualization(data, pdbText);
                }
            }, 300);
            return; // Exit early, will retry after initialization
        }
    }
    
    // Store PDB text if provided
    if (pdbText) {
        currentPDBText = pdbText;
    }
    
    // If we have PDB text, use direct loading (faster and more reliable)
    if (currentPDBText) {
        try {
            viewer.clear();
            
            // Filter PDB text by chains if needed
            let pdbToLoad = currentPDBText;
            if (selectedChains.size > 0 && selectedChains.size < availableChains.length) {
                const lines = currentPDBText.split('\n');
                const filteredLines = lines.filter(line => {
                    if (line.startsWith('ATOM ') || line.startsWith('HETATM')) {
                        const chain = line.substring(21, 22).trim() || 'A';
                        return selectedChains.has(chain);
                    }
                    return true; // Keep non-atom lines (HEADER, TITLE, etc.)
                });
                pdbToLoad = filteredLines.join('\n');
            }
            
            // Load PDB directly into 3Dmol.js (much faster and more reliable)
            viewer.addModel(pdbToLoad, "pdb");
            
            // Apply style
            const styleSelector = document.getElementById('protein-style');
            const colorBySelector = document.getElementById('protein-color-by');
            const style = styleSelector ? styleSelector.value : 'cartoon';
            const colorBy = colorBySelector ? colorBySelector.value : 'spectrum';
            
            applyStyle(style, colorBy);
            
            // Set background color
            if (viewer.setBackgroundColor) {
                viewer.setBackgroundColor(0x1F2823);
            }
            
            // Zoom to fit
            viewer.zoomTo();
            
            // Render
            viewer.render();
            return;
        } catch (err) {
            console.warn('Direct PDB loading failed, falling back to manual method:', err);
            // Continue to fallback method
        }
    }
    
    // Fallback: manual atom-by-atom loading
    if (!data.atoms || data.atoms.length === 0) {
        console.warn('Cannot update visualization: no atoms');
        return;
    }
    
    // Clear viewer
    viewer.clear();
    
    // Filter atoms by selected chains
    const filteredAtoms = data.atoms.filter(atom => 
        selectedChains.size === 0 || selectedChains.has(atom.chain)
    );
    
    if (filteredAtoms.length === 0) {
        console.warn('No atoms to display after filtering');
        return;
    }
    
    // Create a model
    const model = viewer.addModel();
    
    // Add atoms to the model
    filteredAtoms.forEach(atom => {
        try {
            model.addAtom({
                serial: atom.serial || 0,
                elem: atom.element || 'C',
                x: parseFloat(atom.x) || 0,
                y: parseFloat(atom.y) || 0,
                z: parseFloat(atom.z) || 0,
                chain: atom.chain || 'A',
                resi: parseInt(atom.residue_seq) || 0,
                resn: atom.residue || 'UNK'
            });
        } catch (err) {
            console.warn('Error adding atom:', atom, err);
        }
    });
    
    // Add bonds based on proximity
    try {
        model.autoBond();
    } catch (err) {
        console.warn('Error auto-bonding:', err);
    }
    
    // Apply style with color scheme
    const styleSelector = document.getElementById('protein-style');
    const colorBySelector = document.getElementById('protein-color-by');
    const style = styleSelector ? styleSelector.value : 'cartoon';
    const colorBy = colorBySelector ? colorBySelector.value : 'spectrum';
    
    // Show/hide chain selector based on color-by
    const chainSelector = document.getElementById('protein-chain-selector');
    if (chainSelector && colorBy === 'chain' && availableChains.length > 1) {
        chainSelector.style.display = 'block';
    } else if (chainSelector) {
        chainSelector.style.display = 'none';
    }
    
    applyStyle(style, colorBy);
    
    // Zoom to fit
    try {
        viewer.zoomTo();
    } catch (err) {
        console.warn('Error zooming:', err);
    }
    
    // Render
    try {
        viewer.render();
    } catch (err) {
        console.error('Error rendering:', err);
    }
}

// Apply visualization style
function applyStyle(style, colorBy = 'spectrum') {
    if (!viewer) return;
    
    try {
        // Determine color scheme
        let colorScheme = 'spectrum';
        
        if (colorBy === 'chain' && proteinData && proteinData.chains) {
            // Color by chain - use different colors for each chain
            const chainColors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'cyan', 'magenta'];
            proteinData.chains.forEach((chain, idx) => {
                const color = chainColors[idx % chainColors.length];
                const styleObj = {};
                styleObj[style] = { color: color };
                // Use setStyle instead of addStyle for better control
                viewer.setStyle({chain: chain.id}, styleObj);
            });
        } else {
            // Set color scheme based on selection
            if (colorBy === 'residue') {
                colorScheme = 'residue';
            } else if (colorBy === 'element') {
                colorScheme = 'element';
            }
            
            // Apply style based on selection
            const styleObj = {};
            switch (style) {
                case 'cartoon':
                    styleObj.cartoon = { color: colorScheme };
                    break;
                case 'stick':
                    styleObj.stick = { color: colorScheme };
                    break;
                case 'sphere':
                    styleObj.sphere = { color: colorScheme };
                    break;
                default:
                    styleObj.cartoon = { color: colorScheme };
            }
            
            // Apply style to all atoms
            viewer.setStyle({}, styleObj);
        }
        
        // Set background color
        if (viewer.setBackgroundColor) {
            viewer.setBackgroundColor(0x1F2823);
        }
        
        // Render
        viewer.render();
    } catch (err) {
        console.error('Error applying style:', err);
        // Fallback: try simple style
        try {
            viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
            if (viewer.setBackgroundColor) {
                viewer.setBackgroundColor(0x1F2823);
            }
            viewer.render();
        } catch (fallbackErr) {
            console.error('Fallback style also failed:', fallbackErr);
        }
    }
}

// Update visualization style
function updateVisualizationStyle() {
    const styleSelector = document.getElementById('protein-style');
    const colorBySelector = document.getElementById('protein-color-by');
    if (styleSelector && colorBySelector) {
        applyStyle(styleSelector.value, colorBySelector.value);
    }
}
