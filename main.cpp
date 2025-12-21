#include <iostream>
#include <string>
#include <vector>
#include <fstream>
#include <memory>

using namespace std;

// Filesystem support
#ifdef USE_EXPERIMENTAL_FILESYSTEM
#include <experimental/filesystem>
namespace fs = experimental::filesystem;
#else
#include <filesystem>
namespace fs = filesystem;
#endif

// Module headers
#include "engine/dna/dna_search.h"
#include "engine/graph/graph_analyzer.h"
#include "engine/evolution/mutation_simulator.h"
#include "engine/protein/protein_parser.h"
#include "engine/utils/json_exporter.h"

void ensure_output_directory()
{
    const string output_dir = "output";

    if (!fs::exists(output_dir))
    {
        cout << "Creating output directory..." << endl;
        fs::create_directory(output_dir);
    }
}

void print_menu()
{
    cout << "\n=== BioStructure Explorer - CLI Version ===" << endl;
    cout << "1. DNA Pattern Search Engine" << endl;
    cout << "2. Gene/Protein Interaction Graph Analyzer" << endl;
    cout << "3. Evolution & Mutation Spread Simulator" << endl;
    cout << "4. Protein Structural Data Parser" << endl;
    cout << "0. Exit" << endl;
    cout << "Enter your choice: ";
}

int main()
{
    // Ensuring output directory exists
    ensure_output_directory();

    int choice = -1;

    while (choice != 0)
    {
        print_menu();
        cin >> choice;

        switch (choice)
        {
        case 1:
        {
            string filename, pattern;

            cout << "Enter FASTA file path: ";
            cin >> filename;

            cout << "Enter pattern to search: ";
            cin >> pattern;

            dna::DNASearchEngine search_engine;
            if (search_engine.load_fasta(filename))
            {
                search_engine.search_pattern(pattern, "KMP");
                search_engine.export_results("output/dna_search_results.json");
                cout << "Results exported to output/dna_search_results.json" << endl;
            }
            break;
        }
        case 2:
        {
            string filename, start_node;

            cout << "Enter interaction CSV file path: ";
            cin >> filename;

            cout << "Enter start node for traversal: ";
            cin >> start_node;

            graph::GraphAnalyzer graph_analyzer;
            if (graph_analyzer.load_interactions(filename))
            {
                graph_analyzer.analyze(start_node);
                graph_analyzer.export_results("output/graph_analysis_results.json");
                cout << "Results exported to output/graph_analysis_results.json" << endl;

            }
            break;
        }
        case 3:
        {
            int grid_size, steps;
            double mutation_prob, resistance_prob;

            cout << "Enter grid size: ";
            cin >> grid_size;

            cout << "Enter number of simulation steps: ";
            cin >> steps;

            cout << "Enter mutation probability (0.0-1.0): ";
            cin >> mutation_prob;

            cout << "Enter resistance probability (0.0-1.0): ";
            cin >> resistance_prob;

            evolution::MutationSimulator simulator(grid_size, mutation_prob, resistance_prob);
            simulator.run_simulation(steps);
            simulator.export_results("output/mutation_simulation_results.json");
            cout << "Results exported to output/mutation_simulation_results.json" << endl;
            break;
        }
        case 4:
        {
            string filename;
            cout << "Enter PDB file path: ";
            cin >> filename;

            protein::ProteinParser parser;
            
            if (parser.load_pdb(filename))
            {
                parser.export_results("output/protein_structure.json");
                cout << "Results exported to output/protein_structure.json" << endl;
            }

            break;
        }
        case 0:
            cout << "Exiting program. Goodbye!" << endl;
            break;
        default:
            cout << "Invalid choice. Please try again." << endl;

        }
    }



    return 0;
}
