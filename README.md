# BioStructure Explorer - DSA Project

A high-fidelity C++ engine for interpretable computational biology and bio-structural dynamics in molecular, genomic, and network simulations.

## Project Overview

This project implements a modular C++ engine that demonstrates advanced Data Structures & Algorithms concepts using real biological data, with a simple web-based visualization layer to present results visually.

### Core Features

- **DNA Pattern Search Engine**: Implements KMP algorithm for efficient pattern matching in DNA sequences
- **Gene/Protein Interaction Graph Analyzer**: Graph-based analysis of biological networks using BFS, DFS, and centrality metrics
- **Evolution & Mutation Spread Simulator**: Simulates mutation spread over time using queue-based time steps
- **Protein Structural Data Parser**: Parses PDB files to extract atom coordinates and structural information

## Project Structure

```
BioStructureExplorer/
├── engine/               # C++ engine components
│   ├── dna/              # DNA pattern search engine (KMP algorithm)
│   ├── graph/            # Gene/protein interaction graph analyzer (BFS, DFS, centrality)
│   ├── evolution/        # Evolution & mutation spread simulator (queue-based)
│   ├── protein/          # Protein structural data parser (PDB parsing)
│   └── utils/            # Shared utilities (JSON exporter)
├── visualization/        # Web-based visualization layer
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   └── icons/            # Application icons
├── data/                 # Sample datasets
│   ├── dna/              # DNA sequence datasets
│   ├── graph/            # Network graph datasets
│   ├── evolution/        # Evolution simulation datasets
│   └── protein/          # Protein structure datasets
└── output/               # JSON output files (pre-generated for visualization)
```

## Quick Start

### Running the Visualization

1. Locate to repository folder.
2. Run command  python -m http.server 8000  in terminal.
3. Go to `http://localhost:8000/visualization/index.html` to see the project.

### Building the C++ Engine

If you want to rebuild the C++ engine or process your own data:

1. Create a build directory:
   ```
   mkdir build
   cd build
   ```

2. Configure with CMake:
   ```
   cmake ..
   ```

3. Build the project:
   ```
   cmake --build .
   ```

4. Run the application:
   ```
   ./BioStructureExplorer  # On Linux/macOS
   BioStructureExplorer.exe  # On Windows
   ```

## Using the Application

1. **Open the visualization**: Navigate to `visualization/index.html` in your browser
2. **Select a module**: Click on any module card (DNA, Graph, Mutation, or Protein)
3. **View results**: Sample data is automatically loaded and displayed
4. **Upload custom data**: Use the file upload option to analyze your own data files

## Data Structures & Algorithms Demonstrated

### 1. Knuth-Morris-Pratt (KMP) Algorithm
- **Location**: `engine/dna/dna_search.cpp`
- **Purpose**: Efficient pattern matching in DNA sequences
- **Time Complexity**: O(n + m) where n is text length and m is pattern length
- **Key Data Structure**: Prefix function array (pi array)

### 2. Breadth-First Search (BFS)
- **Location**: `engine/graph/graph_analyzer.cpp`
- **Purpose**: Level-by-level graph traversal
- **Time Complexity**: O(V + E) where V is vertices and E is edges
- **Key Data Structure**: Queue (std::queue)

### 3. Depth-First Search (DFS)
- **Location**: `engine/graph/graph_analyzer.cpp`
- **Purpose**: Deep traversal of graph structures
- **Time Complexity**: O(V + E) where V is vertices and E is edges
- **Key Data Structure**: Stack (recursive call stack)

### 4. Degree Centrality
- **Location**: `engine/graph/graph_analyzer.cpp`
- **Purpose**: Measure node importance in networks
- **Key Data Structure**: Adjacency list (std::unordered_map)

### 5. Queue-Based Simulation
- **Location**: `engine/evolution/mutation_simulator.cpp`
- **Purpose**: Time-step based mutation spread simulation
- **Key Data Structure**: Queue (std::queue) for processing cells

### 6. File Parsing
- **Location**: `engine/protein/protein_parser.cpp`
- **Purpose**: Structured data extraction from PDB files
- **Key Data Structure**: Vectors and maps for organizing atom data

## Algorithm Explanations

### Knuth-Morris-Pratt (KMP) Algorithm

KMP is an efficient string-matching algorithm that uses information about the pattern to minimize comparisons. Unlike naive approaches that may repeatedly compare the same characters, KMP precomputes a prefix function that allows it to skip redundant comparisons.

**How it works:**
1. Precompute a prefix function (pi array) that stores the longest proper prefix which is also a suffix
2. Use this information to skip characters that are guaranteed to match
3. Achieves linear time complexity O(n + m)

### Breadth-First Search (BFS)

BFS explores a graph level by level, starting from a source node and visiting all neighbors before moving to the next level. It uses a queue data structure to maintain the order of nodes to visit.

**How it works:**
1. Start with the source node in a queue
2. Dequeue a node, mark it as visited, and add all unvisited neighbors to the queue
3. Repeat until the queue is empty

### Depth-First Search (DFS)

DFS explores a graph by going as deep as possible along each branch before backtracking. It uses recursion or a stack to maintain the order of nodes to visit.

**How it works:**
1. Start from a source node
2. Recursively visit the first unvisited neighbor
3. Backtrack when no more unvisited neighbors exist

### Degree Centrality

Degree centrality is a measure of the importance of a node in a network, calculated as the number of connections (edges) a node has. It is normalized by dividing by the maximum possible connections (n-1).

## Sample Data

The project includes pre-generated sample data in the `output/` directory:
- `dna_search_results.json` - DNA pattern search results
- `graph_analysis_results.json` - Graph analysis results
- `mutation_simulation_results.json` - Mutation simulation results
- `protein_structure.json` - Protein structure data

## Requirements

- **C++ Compiler**: C++17 compatible (GCC 8+, Clang 7+, MSVC 2019+)
- **CMake**: Version 3.10 or higher
- **Web Browser**: Modern browser with JavaScript enabled (for visualization)

## License

This project is released under the MIT License.

## Acknowledgments

- This project was developed as part of a Data Structures & Algorithms course
- Sample datasets are provided for educational purposes only