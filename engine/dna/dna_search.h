#ifndef DNA_SEARCH_H
#define DNA_SEARCH_H

#include <string>
#include <vector>
#include <chrono>
#include <fstream>
#include <iostream>
#include "../utils/json_exporter.h"

namespace dna
{

    class DNASearchEngine
    {
    public:
        DNASearchEngine() = default;
        ~DNASearchEngine() = default;

        // Load DNA sequence from FASTA file
        bool load_fasta(const std::string &filename);

        // Search for a pattern using specified algorithm
        void search_pattern(const std::string &pattern, const std::string &algorithm);

        // Export results to JSON
        bool export_results(const std::string &filename);

    private:
        std::string m_dna_sequence;
        std::string m_pattern;
        std::string m_algorithm;
        std::vector<int> m_matches;
        int m_comparisons;
        double m_execution_time_ms;

        // KMP algorithm implementation
        std::vector<int> kmp_search(const std::string &text, const std::string &pattern, int &comparisons);

        // Compute KMP prefix function
        std::vector<int> compute_prefix_function(const std::string &pattern);

        // Naive search algorithm for comparison
        std::vector<int> naive_search(const std::string &text, const std::string &pattern, int &comparisons);
    };

} // namespace dna

#endif // DNA_SEARCH_H
