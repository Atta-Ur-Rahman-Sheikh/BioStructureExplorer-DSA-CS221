// Main JavaScript file for BioStructure Explorer

// Navigation functionality
document.addEventListener('DOMContentLoaded', () => {
    // Get all navigation links
    const navLinks = document.querySelectorAll('nav ul li a');
    
    // Add click event listeners to each link
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.module-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Get the module ID from the href attribute
            const moduleId = link.getAttribute('href').substring(1);
            
            // Show the corresponding section
            document.getElementById(moduleId).classList.add('active');
        });
    });
    
    // Load sample data buttons
    document.getElementById('dna-load-sample').addEventListener('click', loadSampleDNAData);
    document.getElementById('graph-load-sample').addEventListener('click', loadSampleGraphData);
    document.getElementById('evolution-load-sample').addEventListener('click', loadSampleEvolutionData);
    document.getElementById('protein-load-sample').addEventListener('click', loadSampleProteinData);
    
    // File input change events
    document.getElementById('dna-file').addEventListener('change', handleDNAFileUpload);
    document.getElementById('graph-file').addEventListener('change', handleGraphFileUpload);
    document.getElementById('evolution-file').addEventListener('change', handleEvolutionFileUpload);
    document.getElementById('protein-file').addEventListener('change', handleProteinFileUpload);
});

// Helper function to fetch JSON data
async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching JSON:', error);
        return null;
    }
}

// Load sample data functions
async function loadSampleDNAData() {
    const data = await fetchJSON('../output/dna_search_results.json');
    if (data) {
        updateDNAVisualization(data);
    } else {
        alert('Failed to load sample DNA data. Make sure the file exists at ../output/dna_search_results.json');
    }
}

async function loadSampleGraphData() {
    const data = await fetchJSON('../output/graph_analysis_results.json');
    if (data) {
        updateGraphVisualization(data);
    } else {
        alert('Failed to load sample graph data. Make sure the file exists at ../output/graph_analysis_results.json');
    }
}

async function loadSampleEvolutionData() {
    const data = await fetchJSON('../output/mutation_simulation_results.json');
    if (data) {
        updateEvolutionVisualization(data);
    } else {
        alert('Failed to load sample evolution data. Make sure the file exists at ../output/mutation_simulation_results.json');
    }
}

async function loadSampleProteinData() {
    const data = await fetchJSON('../output/protein_structure.json');
    if (data) {
        updateProteinVisualization(data);
    } else {
        alert('Failed to load sample protein data. Make sure the file exists at ../output/protein_structure.json');
    }
}

// File upload handlers
function handleDNAFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                updateDNAVisualization(data);
            } catch (error) {
                console.error('Error parsing DNA JSON:', error);
                alert('Invalid JSON file format');
            }
        };
        reader.readAsText(file);
    }
}

function handleGraphFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                updateGraphVisualization(data);
            } catch (error) {
                console.error('Error parsing graph JSON:', error);
                alert('Invalid JSON file format');
            }
        };
        reader.readAsText(file);
    }
}

function handleEvolutionFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                updateEvolutionVisualization(data);
            } catch (error) {
                console.error('Error parsing evolution JSON:', error);
                alert('Invalid JSON file format');
            }
        };
        reader.readAsText(file);
    }
}

function handleProteinFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                updateProteinVisualization(data);
            } catch (error) {
                console.error('Error parsing protein JSON:', error);
                alert('Invalid JSON file format');
            }
        };
        reader.readAsText(file);
    }
}
