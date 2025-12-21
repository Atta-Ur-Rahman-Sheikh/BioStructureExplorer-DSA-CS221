#include "mutation_simulator.h"
#include <iostream>
#include <unordered_set>

namespace evolution {

MutationSimulator::MutationSimulator(int grid_size, double mutation_prob, double resistance_prob)
    : m_grid_size(grid_size),
      m_mutation_probability(mutation_prob),
      m_resistance_probability(resistance_prob) {
    
    // Initialize random number generator with a time-based seed
    unsigned seed = std::chrono::system_clock::now().time_since_epoch().count();
    m_rng = std::mt19937(seed);
    m_dist = std::uniform_real_distribution<double>(0.0, 1.0);
    
    // Initialize grid with all normal cells
    m_grid = std::vector<std::vector<int>>(grid_size, std::vector<int>(grid_size, NORMAL));
    
    // Initialize with default settings
    initialize();
}

void MutationSimulator::initialize(int num_initial_mutations) {
    // Reset grid to all normal cells
    for (auto& row : m_grid) {
        std::fill(row.begin(), row.end(), NORMAL);
    }
    
    // Clear simulation history
    m_simulation_history.clear();
    
    // Add initial mutations at random positions
    std::uniform_int_distribution<int> pos_dist(0, m_grid_size - 1);
    
    for (int i = 0; i < num_initial_mutations; ++i) {
        int row = pos_dist(m_rng);
        int col = pos_dist(m_rng);
        m_grid[row][col] = MUTATED;
    }
    
    // Store initial state in history
    m_simulation_history.push_back(m_grid);
    
    std::cout << "Initialized mutation simulation with grid size " << m_grid_size << "x" << m_grid_size << std::endl;
    std::cout << "  - Mutation probability: " << m_mutation_probability << std::endl;
    std::cout << "  - Resistance probability: " << m_resistance_probability << std::endl;
    std::cout << "  - Initial mutations: " << num_initial_mutations << std::endl;
}

void MutationSimulator::run_simulation(int steps) {
    std::cout << "Running mutation simulation for " << steps << " steps..." << std::endl;
    
    for (int step = 0; step < steps; ++step) {
        simulate_step();
        m_simulation_history.push_back(m_grid);
        
        // Print progress every 10 steps
        if ((step + 1) % 10 == 0 || step == steps - 1) {
            std::cout << "  - Completed step " << (step + 1) << " of " << steps << std::endl;
        }
    }
    
    // Count final cell states
    int normal_count = 0;
    int mutated_count = 0;
    int resistant_count = 0;
    
    for (const auto& row : m_grid) {
        for (int cell : row) {
            if (cell == NORMAL) normal_count++;
            else if (cell == MUTATED) mutated_count++;
            else if (cell == RESISTANT) resistant_count++;
        }
    }
    
    std::cout << "Simulation complete. Final cell counts:" << std::endl;
    std::cout << "  - Normal cells: " << normal_count << std::endl;
    std::cout << "  - Mutated cells: " << mutated_count << std::endl;
    std::cout << "  - Resistant cells: " << resistant_count << std::endl;
}

void MutationSimulator::simulate_step() {
    // Create a copy of the current grid
    auto new_grid = m_grid;
    
    // Process mutations using BFS-like approach
    std::queue<Position> mutation_queue;
    std::unordered_set<Position, PositionHash> processed;
    
    // Find all currently mutated cells
    for (int i = 0; i < m_grid_size; ++i) {
        for (int j = 0; j < m_grid_size; ++j) {
            if (m_grid[i][j] == MUTATED) {
                mutation_queue.push(Position(i, j));
                processed.insert(Position(i, j));
            }
        }
    }
    
    // Process mutation spread
    while (!mutation_queue.empty()) {
        Position pos = mutation_queue.front();
        mutation_queue.pop();
        
        // Get neighbors
        auto neighbors = get_neighbors(pos.row, pos.col);
        
        for (const auto& neighbor : neighbors) {
            // Skip already processed positions
            if (processed.find(neighbor) != processed.end()) {
                continue;
            }
            
            processed.insert(neighbor);
            
            // Only normal cells can be mutated or develop resistance
            if (m_grid[neighbor.row][neighbor.col] == NORMAL) {
                // Check if mutation occurs based on probability
                if (m_dist(m_rng) < m_mutation_probability) {
                    new_grid[neighbor.row][neighbor.col] = MUTATED;
                }
                // Check if resistance develops (only if not already mutated)
                else if (m_dist(m_rng) < m_resistance_probability) {
                    new_grid[neighbor.row][neighbor.col] = RESISTANT;
                }
            }
        }
    }
    
    // Update grid
    m_grid = new_grid;
}

bool MutationSimulator::is_valid_position(int row, int col) const {
    return row >= 0 && row < m_grid_size && col >= 0 && col < m_grid_size;
}

std::vector<Position> MutationSimulator::get_neighbors(int row, int col) const {
    std::vector<Position> neighbors;
    
    // 4-directional neighbors (von Neumann neighborhood)
    const int dr[] = {-1, 0, 1, 0};
    const int dc[] = {0, 1, 0, -1};
    
    for (int i = 0; i < 4; ++i) {
        int new_row = row + dr[i];
        int new_col = col + dc[i];
        
        if (is_valid_position(new_row, new_col)) {
            neighbors.emplace_back(new_row, new_col);
        }
    }
    
    return neighbors;
}

bool MutationSimulator::export_results(const std::string& filename) {
    utils::JSONExporter exporter;
    
    // Add simulation parameters
    exporter.add_int("grid_size", m_grid_size);
    exporter.add_double("mutation_probability", m_mutation_probability);
    exporter.add_double("resistance_probability", m_resistance_probability);
    exporter.add_int("steps", m_simulation_history.size() - 1);
    
    // Add simulation history
    exporter.start_array("history");
    for (size_t step = 0; step < m_simulation_history.size(); ++step) {
        std::map<std::string, std::string> step_obj = {
            {"step", std::to_string(step)}
        };
        exporter.add_object_to_array(step_obj, step == m_simulation_history.size() - 1);
        
        // Add grid for this step
        exporter.add_grid("grid", m_simulation_history[step]);
    }
    exporter.end_array();
    
    return exporter.export_to_file(filename);
}

} // namespace evolution
