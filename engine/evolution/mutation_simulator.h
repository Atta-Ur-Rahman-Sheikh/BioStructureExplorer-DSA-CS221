#ifndef MUTATION_SIMULATOR_H
#define MUTATION_SIMULATOR_H

#include <vector>
#include <queue>
#include <random>
#include <chrono>
#include "../utils/json_exporter.h"

namespace evolution
{

    // Cell states
    enum CellState
    {
        NORMAL = 0,
        MUTATED = 1,
        RESISTANT = 2
    };

    // Position in 2D grid
    struct Position
    {
        int row;
        int col;

        Position(int r, int c) : row(r), col(c) {}

        bool operator==(const Position &other) const
        {
            return row == other.row && col == other.col;
        }
    };

    // Custom hash function for Position
    struct PositionHash
    {
        std::size_t operator()(const Position &pos) const
        {
            return std::hash<int>()(pos.row) ^ (std::hash<int>()(pos.col) << 1);
        }
    };

    class MutationSimulator
    {
    public:
        MutationSimulator(int grid_size, double mutation_prob = 0.3, double resistance_prob = 0.1);
        ~MutationSimulator() = default;

        // Initialize the grid with initial mutations
        void initialize(int num_initial_mutations = 1);

        // Run the simulation for a specified number of steps
        void run_simulation(int steps);

        // Get the current state of the grid
        const std::vector<std::vector<int>> &get_grid() const { return m_grid; }

        // Export results to JSON
        bool export_results(const std::string &filename);

    private:
        int m_grid_size;
        double m_mutation_probability;
        double m_resistance_probability;
        std::vector<std::vector<int>> m_grid;
        std::vector<std::vector<std::vector<int>>> m_simulation_history;

        // Random number generator
        std::mt19937 m_rng;
        std::uniform_real_distribution<double> m_dist;

        // Perform one step of the simulation
        void simulate_step();

        // Check if a position is valid (within grid bounds)
        bool is_valid_position(int row, int col) const;

        // Get the neighbors of a cell
        std::vector<Position> get_neighbors(int row, int col) const;
    };

} // namespace evolution

#endif // MUTATION_SIMULATOR_H
