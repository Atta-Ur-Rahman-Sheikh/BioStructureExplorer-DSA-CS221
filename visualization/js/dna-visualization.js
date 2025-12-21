// DNA Pattern Search Visualization

// Initialize when DOM is ready
function initializeDNAPage() {
    console.log('Initializing DNA page...');
    
    // Initialize DNA visualization
    initDNAVisualization();
    
    // Immediately display default data, then try to fetch better data
    const defaultData = createDefaultDNAData();
    console.log('Default DNA data created:', defaultData);
    
    if (defaultData && defaultData.sequence) {
        dnaData = defaultData;
        // Small delay to ensure DOM is fully ready
        setTimeout(() => {
            console.log('Updating DNA visualization with default data');
            updateDNAVisualization(defaultData);
        }, 200);
    } else {
        console.error('Failed to create default DNA data');
    }
    
    // Try to load from file in the background
    loadSampleDNAData();
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDNAPage);
} else {
    // DOM is already loaded
    initializeDNAPage();
}

// Global variables
let dnaData = null;
let dnaVisualization = null;
let currentZoom = 1.0;
let searchPattern = '';
let currentSequence = '';
let allMatches = [];

// Initialize DNA visualization
function initDNAVisualization() {
    // Set up event listeners
    const fileInput = document.getElementById('dna-file');
    if (fileInput) {
        fileInput.addEventListener('change', handleDNAFileUpload);
    }
    
    // Search pattern input
    const searchInput = document.getElementById('dna-search-pattern');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchPattern = e.target.value.toUpperCase();
            if (dnaData) {
                updateDNAVisualization(dnaData);
            }
        });
    }
    
    // Zoom controls
    const zoomInBtn = document.getElementById('dna-zoom-in');
    const zoomOutBtn = document.getElementById('dna-zoom-out');
    const zoomResetBtn = document.getElementById('dna-zoom-reset');
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            currentZoom = Math.min(currentZoom + 0.2, 3.0);
            applyZoom();
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            currentZoom = Math.max(currentZoom - 0.2, 0.5);
            applyZoom();
        });
    }
    
    if (zoomResetBtn) {
        zoomResetBtn.addEventListener('click', () => {
            currentZoom = 1.0;
            applyZoom();
        });
    }
    
    // Try to initialize 3D visualization if Three.js is available
    try {
        import('./three-utils.js').then(module => {
            dnaVisualization = new module.DNAVisualization('dna-3d-viz');
            if (dnaData) {
                update3DVisualization(dnaData);
            }
        }).catch(err => {
            console.log('Three.js not available, using 2D visualization only');
        });
    } catch (err) {
        console.log('Three.js not available, using 2D visualization only');
    }
}

// Load sample DNA data automatically (runs in background after default data is shown)
async function loadSampleDNAData() {
    try {
        // Try to load the FASTA file first (more reliable)
        try {
            const fastaResponse = await fetch('../data/dna/tutorial_sequence.fasta');
            if (fastaResponse.ok) {
                const fastaText = await fastaResponse.text();
                // Parse FASTA and create sample data
                const data = createSampleDNAData(fastaText, 'ACGT');
                if (data && data.sequence && data.sequence.length > 0) {
                    dnaData = data;
                    updateDNAVisualization(data);
                    console.log('Loaded DNA data from FASTA file');
                    return;
                }
            }
        } catch (fastaError) {
            console.log('Could not load FASTA file, trying JSON...');
        }
        
        // Try to load from output directory (relative to visualization folder)
        try {
            const data = await fetchJSON('../output/dna_search_results.json');
            if (data && data.sequence && data.sequence.length > 0) {
                dnaData = data;
                updateDNAVisualization(data);
                console.log('Loaded DNA data from JSON file');
                return;
            }
        } catch (jsonError) {
            console.log('Could not load JSON file, using default data');
        }
    } catch (error) {
        // Ignore fetch errors - we already have default data displayed
        console.log('Error loading sample data, using default:', error);
    }
}

// Create sample DNA data from FASTA text
function createSampleDNAData(fastaText, pattern) {
    // Extract sequence from FASTA (remove header lines starting with >)
    const lines = fastaText.split('\n');
    let sequence = '';
    for (const line of lines) {
        if (line && !line.startsWith('>')) {
            sequence += line.trim().toUpperCase();
        }
    }
    
    // Validate and clean sequence (only A, T, G, C)
    sequence = sequence.replace(/[^ATGC]/g, '');
    
    // Use provided pattern or default to 'ACGT'
    const searchPattern = pattern || 'ACGT';
    
    // Simple pattern matching (simplified KMP)
    const matches = [];
    for (let i = 0; i <= sequence.length - searchPattern.length; i++) {
        if (sequence.substring(i, i + searchPattern.length) === searchPattern) {
            matches.push(i);
        }
    }
    
    // Calculate realistic comparisons (KMP is more efficient than naive)
    const comparisons = sequence.length + searchPattern.length * matches.length;
    
    return {
        dna_length: sequence.length,
        pattern: searchPattern,
        matches: matches,
        comparisons: comparisons,
        execution_time_ms: 0.5,
        algorithm: 'KMP',
        sequence: sequence // Include actual sequence
    };
}

// Create default sample DNA data with better demonstration
function createDefaultDNAData() {
    // Create a more realistic DNA sequence with various patterns
    const segments = [
        'ATGCGATCGATCGATCG',  // Start segment
        'ACGTACGTACGT',        // Repeating pattern
        'TTTTAAAACCCCGGGG',    // Homopolymer regions
        'GCTAGCTAGCTAGCTA',    // Another pattern
        'ATGCATGCATGCATGC',    // Repeating ATGC
        'ACGTACGTACGTACGT',    // More ACGT repeats
        'TTTTAAAACCCCGGGG',    // More homopolymers
        'GCTAGCTAGCTAGCTA',    // Pattern repeats
        'ATGCATGCATGCATGC',    // More ATGC
        'ACGTACGTACGTACGT'     // Final segment
    ];
    
    const sequence = segments.join('');
    const pattern = 'ACGT'; // Common pattern that appears multiple times
    const matches = [];
    
    // Find all matches using simple pattern matching
    for (let i = 0; i <= sequence.length - pattern.length; i++) {
        if (sequence.substring(i, i + pattern.length) === pattern) {
            matches.push(i);
        }
    }
    
    // Calculate realistic comparisons (KMP would be more efficient)
    const comparisons = sequence.length + pattern.length * matches.length;
    
    return {
        dna_length: sequence.length,
        pattern: pattern,
        matches: matches,
        comparisons: comparisons,
        execution_time_ms: 0.5,
        algorithm: 'KMP',
        sequence: sequence
    };
}

// Handle DNA file upload
function handleDNAFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const fileContent = e.target.result;
                const fileName = file.name.toLowerCase();
                
                // Check if it's a FASTA file
                if (fileName.endsWith('.fasta') || fileName.endsWith('.fa') || fileName.endsWith('.fna')) {
                    // Parse FASTA file
                    const pattern = searchPattern || 'ACGT'; // Use current search pattern or default
                    const data = createSampleDNAData(fileContent, pattern);
                    if (data && data.sequence && data.sequence.length > 0) {
                        dnaData = data;
                        updateDNAVisualization(data);
                        console.log('Loaded DNA sequence from FASTA file');
                    } else {
                        alert('Invalid FASTA file format or empty sequence');
                    }
                } else {
                    // Parse JSON file
                    const data = JSON.parse(fileContent);
                    dnaData = data;
                    updateDNAVisualization(data);
                    console.log('Loaded DNA data from JSON file');
                }
            } catch (error) {
                console.error('Error parsing DNA file:', error);
                alert('Invalid file format. Please upload a valid JSON or FASTA file.');
            }
        };
        reader.readAsText(file);
    }
}

// Update DNA visualization
function updateDNAVisualization(data) {
    if (!data) {
        console.error('No data provided to updateDNAVisualization');
        return;
    }
    
    // Update stats (only essential ones)
    const lengthEl = document.getElementById('dna-length');
    const patternEl = document.getElementById('dna-pattern');
    const matchesEl = document.getElementById('dna-matches');
    
    if (lengthEl) lengthEl.textContent = data.dna_length || '-';
    if (patternEl) patternEl.textContent = data.pattern || '-';
    if (matchesEl) matchesEl.textContent = data.matches ? data.matches.length : '-';
    
    // Update 2D visualization
    update2DVisualization(data);
    
    // Update 3D visualization if available
    if (dnaVisualization) {
        update3DVisualization(data);
    }
}

// Get base color
function getBaseColor(base) {
    switch (base) {
        case 'A': return '#4caf50'; // Green
        case 'T': return '#f44336'; // Red
        case 'G': return '#2196f3'; // Blue
        case 'C': return '#ffeb3b'; // Yellow
        default: return '#333';
    }
}

// Apply zoom to sequence
function applyZoom() {
    const sequenceElement = document.querySelector('.dna-sequence-viewer');
    if (sequenceElement) {
        sequenceElement.style.transform = `scale(${currentZoom})`;
        sequenceElement.style.transformOrigin = 'top left';
    }
}

// Update 2D visualization
function update2DVisualization(data) {
    const vizContainer = document.getElementById('dna-2d-viz');
    if (!vizContainer) return;
    
    // Clear previous visualization
    vizContainer.innerHTML = '';
    
    if (!data.dna_length || !data.pattern) {
        vizContainer.innerHTML = '<p style="padding: 2rem; text-align: center; color: #666;">No DNA data available</p>';
        return;
    }
    
    // Use actual sequence if available, otherwise generate
    currentSequence = data.sequence || generatePlaceholderSequence(data.dna_length);
    
    // Get matches - use search pattern if provided, otherwise use data.matches
    let matches = [];
    let patternToUse = searchPattern || data.pattern || '';
    
    if (searchPattern && searchPattern.length > 0) {
        // Real-time search
        for (let i = 0; i <= currentSequence.length - searchPattern.length; i++) {
            if (currentSequence.substring(i, i + searchPattern.length) === searchPattern) {
                matches.push(i);
            }
        }
        allMatches = matches;
    } else {
        matches = data.matches || [];
        allMatches = matches;
    }
    
    // Update match list
    updateMatchList(matches, patternToUse || data.pattern);
    
    // Create scrollable container - fill the absolute positioned parent
    const scrollContainer = document.createElement('div');
    scrollContainer.style.cssText = 'width: 100%; height: 100%; overflow: auto; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: transparent; padding: 1rem; box-sizing: border-box;';
    
    // Create DNA sequence element with zoom support - wrap into multiple lines
    const sequenceElement = document.createElement('div');
    sequenceElement.className = 'dna-sequence-viewer';
    sequenceElement.style.cssText = 'font-family: monospace; font-size: 13px; line-height: 1.6; padding: 1rem; background: transparent; color: #DCD7C9;';
    sequenceElement.id = 'dna-sequence-display';
    
    // Format sequence with color-coded bases, grouped and wrapped
    const basesPerLine = 60;
    const basesPerGroup = 10;
    let formattedSequence = '';
    let lastIndex = 0;
    const pattern = patternToUse || data.pattern || '';
    
    // Build sequence with matches highlighted
    let sequenceHTML = '';
    if (matches.length > 0 && pattern.length > 0) {
        const sortedMatches = [...matches].sort((a, b) => a - b);
        
        sortedMatches.forEach((matchIndex, idx) => {
            // Add sequence before match
            for (let i = lastIndex; i < matchIndex; i++) {
                const base = currentSequence[i];
                const color = getBaseColor(base);
                sequenceHTML += `<span class="dna-base" data-index="${i}" style="color: ${color}; font-weight: 600;" title="Position ${i + 1}: ${base}">${escapeHtml(base)}</span>`;
            }
            
            // Add match with highlighting
            sequenceHTML += `<span class="dna-match-highlight" data-match-index="${idx}" data-start="${matchIndex}" style="background-color: #ffeb3b; font-weight: bold; padding: 2px 3px; border-radius: 3px; cursor: pointer; border: 1px solid #ffc107;" title="Match ${idx + 1} at position ${matchIndex + 1}">`;
            for (let i = matchIndex; i < matchIndex + pattern.length; i++) {
                const base = currentSequence[i];
                const color = getBaseColor(base);
                sequenceHTML += `<span class="dna-base" data-index="${i}" style="color: ${color}; font-weight: bold;" title="Position ${i + 1}: ${base}">${escapeHtml(base)}</span>`;
            }
            sequenceHTML += '</span>';
            
            lastIndex = matchIndex + pattern.length;
        });
        
        // Add remaining sequence
        for (let i = lastIndex; i < currentSequence.length; i++) {
            const base = currentSequence[i];
            const color = getBaseColor(base);
            sequenceHTML += `<span class="dna-base" data-index="${i}" style="color: ${color}; font-weight: 600;" title="Position ${i + 1}: ${base}">${escapeHtml(base)}</span>`;
        }
    } else {
        // No matches, just color-code the sequence
        for (let i = 0; i < currentSequence.length; i++) {
            const base = currentSequence[i];
            const color = getBaseColor(base);
            sequenceHTML += `<span class="dna-base" data-index="${i}" style="color: ${color}; font-weight: 600;" title="Position ${i + 1}: ${base}">${escapeHtml(base)}</span>`;
        }
    }
    
    // Break into lines with line numbers and grouping
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sequenceHTML;
    // Only get base spans (with dna-base class), not wrapper spans
    const baseSpans = Array.from(tempDiv.querySelectorAll('span.dna-base'));
    
    let baseCount = 0;
    let lineNumber = 1;
    let lineStartPos = 1;
    let inMatch = false;
    let matchSpan = null;
    
    formattedSequence = '';
    
    for (let i = 0; i < baseSpans.length; i++) {
        const span = baseSpans[i];
        const baseIndex = parseInt(span.dataset.index);
        
        // Start new line
        if (baseCount % basesPerLine === 0 && baseCount > 0) {
            // Close any open match span before ending line
            if (inMatch && matchSpan) {
                formattedSequence += '</span>';
                inMatch = false;
            }
            formattedSequence += '</span></div>';
            lineNumber++;
            lineStartPos = baseCount + 1;
        }
        
        // Start of line - add line number
        if (baseCount % basesPerLine === 0) {
            formattedSequence += `<div style="display: flex; align-items: flex-start; margin-bottom: 0.3rem; line-height: 1.6;">`;
            formattedSequence += `<span style="min-width: 45px; text-align: right; padding-right: 0.75rem; color: var(--accent); font-weight: 600; font-size: 0.7rem; user-select: none;">${String(lineStartPos).padStart(4, ' ')}</span>`;
            formattedSequence += `<span style="flex: 1; letter-spacing: 0.5px;">`;
            
            // Reopen match span if we were in one
            if (inMatch && matchSpan) {
                formattedSequence += `<span class="dna-match-highlight" data-match-index="${matchSpan.dataset.matchIndex}" data-start="${matchSpan.dataset.start}" style="${matchSpan.getAttribute('style')}">`;
            }
        }
        
        // Check if this base is start of a match
        const parentHighlight = span.closest('.dna-match-highlight');
        if (parentHighlight && !inMatch) {
            // Starting a new match
            matchSpan = parentHighlight;
            inMatch = true;
            formattedSequence += `<span class="dna-match-highlight" data-match-index="${parentHighlight.dataset.matchIndex}" data-start="${parentHighlight.dataset.start}" style="${parentHighlight.getAttribute('style')}" title="${parentHighlight.getAttribute('title')}">`;
        } else if (!parentHighlight && inMatch) {
            // Ending a match
            formattedSequence += '</span>';
            inMatch = false;
            matchSpan = null;
        }
        
        // Add the base span
        formattedSequence += span.outerHTML;
        baseCount++;
        
        // Add space every 10 bases for readability
        if (baseCount % basesPerGroup === 0 && baseCount % basesPerLine !== 0) {
            formattedSequence += ' ';
        }
    }
    
    // Close any remaining open match
    if (inMatch) {
        formattedSequence += '</span>';
    }
    
    // Close last line
    if (formattedSequence.length > 0) {
        formattedSequence += '</span></div>';
    }
    
    if (formattedSequence.length === 0) {
        console.warn('Formatted sequence is empty');
        vizContainer.innerHTML = '<p style="padding: 2rem; text-align: center; color: #DCD7C9;">Error: Could not format sequence</p>';
        return;
    }
    
    sequenceElement.innerHTML = formattedSequence;
    scrollContainer.appendChild(sequenceElement);
    vizContainer.appendChild(scrollContainer);
    
    // Ensure container is visible
    vizContainer.classList.add('active');
    vizContainer.style.display = 'block';
    vizContainer.style.visibility = 'visible';
    
    // Apply current zoom
    applyZoom();
    
    console.log('DNA visualization rendered successfully. Sequence length:', currentSequence.length, 'Matches:', matches.length, 'Formatted length:', formattedSequence.length);
    console.log('Container dimensions:', vizContainer.offsetWidth, 'x', vizContainer.offsetHeight);
    
    // Add click handlers to match highlights
    document.querySelectorAll('.dna-match-highlight').forEach(highlight => {
        highlight.addEventListener('click', () => {
            const start = parseInt(highlight.dataset.start);
            // Calculate which line the match is on and scroll to it
            const basesPerLine = 60;
            const lineNumber = Math.floor(start / basesPerLine);
            const allLines = sequenceElement.querySelectorAll('div');
            if (allLines[lineNumber]) {
                allLines[lineNumber].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            highlight.style.backgroundColor = '#ff9800';
            setTimeout(() => {
                highlight.style.backgroundColor = '#ffeb3b';
            }, 1000);
        });
    });
}

// Update match list sidebar
function updateMatchList(matches, pattern) {
    const matchCountEl = document.getElementById('dna-match-count');
    const matchItemsEl = document.getElementById('dna-match-items');
    
    if (matchCountEl) {
        matchCountEl.textContent = matches.length;
    }
    
    if (matchItemsEl) {
        matchItemsEl.innerHTML = '';
        
        if (matches.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No matches found';
            li.style.cssText = 'padding: 0.5rem; color: var(--text-muted); font-style: italic;';
            matchItemsEl.appendChild(li);
            return;
        }
        
        matches.forEach((matchIndex, idx) => {
            const li = document.createElement('li');
            li.textContent = `Position ${matchIndex + 1}`;
            li.dataset.matchIndex = matchIndex;
            li.title = `Click to scroll to match ${idx + 1} at position ${matchIndex + 1}`;
            
            li.addEventListener('click', () => {
                // Scroll to match
                const scrollContainer = document.querySelector('#dna-2d-viz > div');
                if (scrollContainer) {
                    scrollContainer.scrollLeft = (matchIndex * 16 * currentZoom) - 100;
                }
                
                // Highlight the match
                const highlight = document.querySelector(`.dna-match-highlight[data-start="${matchIndex}"]`);
                if (highlight) {
                    highlight.style.backgroundColor = '#ff9800';
                    setTimeout(() => {
                        highlight.style.backgroundColor = '#ffeb3b';
                    }, 1000);
                }
            });
            
            matchItemsEl.appendChild(li);
        });
    }
}

// Update 3D visualization
function update3DVisualization(data) {
    if (!dnaVisualization) return;
    
    if (!data.dna_length || !data.pattern) return;
    
    const sequence = data.sequence || generatePlaceholderSequence(data.dna_length);
    
    // Set the data for the 3D visualization
    dnaVisualization.setData(sequence, data.matches || []);
}

// Generate a placeholder DNA sequence
function generatePlaceholderSequence(length) {
    const bases = ['A', 'T', 'G', 'C'];
    let sequence = '';
    
    for (let i = 0; i < length; i++) {
        sequence += bases[Math.floor(Math.random() * bases.length)];
    }
    
    return sequence;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}