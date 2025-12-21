#include <iostream>
#include <string>
#include <vector>
#include <fstream>
#include <memory>

// Filesystem support
#ifdef USE_EXPERIMENTAL_FILESYSTEM
    #include <experimental/filesystem>
    namespace fs = std::experimental::filesystem;
#else
    #include <filesystem>
    namespace fs = std::filesystem;
#endif

// Module headers
#include "engine/dna/dna_search.h"
#include "engine/graph/graph_analyzer.h"
#include "engine/evolution/mutation_simulator.h"
#include "engine/protein/protein_parser.h"
#include "engine/utils/json_exporter.h"

// Create output directory if it doesn't exist
void ensure_output_directory() {
    const std::string output_dir = "output";
    
    if (!fs::exists(output_dir)) {
        std::cout << "Creating output directory..." << std::endl;
        fs::create_directory(output_dir);
    }
}

void print_menu() {
    std::cout << "\n=== BioStructure Explorer - DSA Project ===" << std::endl;
    std::cout << "1. DNA Pattern Search Engine" << std::endl;
    std::cout << "2. Gene/Protein Interaction Graph Analyzer" << std::endl;
    std::cout << "3. Evolution & Mutation Spread Simulator" << std::endl;
    std::cout << "4. Protein Structural Data Parser" << std::endl;
    std::cout << "0. Exit" << std::endl;
    std::cout << "Enter your choice: ";
}

int main() {
    // Ensure output directory exists
    ensure_output_directory();
    
    int choice = -1;
    
    while (choice != 0) {
        print_menu();
        std::cin >> choice;
        
        switch (choice) {
            case 1: {
                std::string filename, pattern;
                std::cout << "Enter FASTA file path: ";
                std::cin >> filename;
                std::cout << "Enter pattern to search: ";
                std::cin >> pattern;
                
                dna::DNASearchEngine search_engine;
                if (search_engine.load_fasta(filename)) {
                    search_engine.search_pattern(pattern, "KMP");
                    search_engine.export_results("output/dna_search_results.json");
                    std::cout << "Results exported to output/dna_search_results.json" << std::endl;
                }
                break;
            }
            case 2: {
                std::string filename, start_node;
                std::cout << "Enter interaction CSV file path: ";
                std::cin >> filename;
                std::cout << "Enter start node for traversal: ";
                std::cin >> start_node;
                
                graph::GraphAnalyzer graph_analyzer;
                if (graph_analyzer.load_interactions(filename)) {
                    graph_analyzer.analyze(start_node);
                    graph_analyzer.export_results("output/graph_analysis_results.json");
                    std::cout << "Results exported to output/graph_analysis_results.json" << std::endl;
                }
                break;
            }
            case 3: {
                int grid_size, steps;
                double mutation_prob, resistance_prob;
                
                std::cout << "Enter grid size: ";
                std::cin >> grid_size;
                std::cout << "Enter number of simulation steps: ";
                std::cin >> steps;
                std::cout << "Enter mutation probability (0.0-1.0): ";
                std::cin >> mutation_prob;
                std::cout << "Enter resistance probability (0.0-1.0): ";
                std::cin >> resistance_prob;
                
                evolution::MutationSimulator simulator(grid_size, mutation_prob, resistance_prob);
                simulator.run_simulation(steps);
                simulator.export_results("output/mutation_simulation_results.json");
                std::cout << "Results exported to output/mutation_simulation_results.json" << std::endl;
                break;
            }
            case 4: {
                std::string filename;
                std::cout << "Enter PDB file path: ";
                std::cin >> filename;
                
                protein::ProteinParser parser;
                if (parser.load_pdb(filename)) {
                    parser.export_results("output/protein_structure.json");
                    std::cout << "Results exported to output/protein_structure.json" << std::endl;
                }
                break;
            }
            case 0:
                std::cout << "Exiting program. Goodbye!" << std::endl;
                break;
            default:
                std::cout << "Invalid choice. Please try again." << std::endl;
        }
    }
    
    return 0;
}
