#include "dna_search.h"
#include <algorithm>
#include <cctype>

namespace dna {

bool DNASearchEngine::load_fasta(const std::string& filename) {
    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cerr << "Error: Could not open file " << filename << std::endl;
        return false;
    }
    
    std::string line;
    m_dna_sequence.clear();
    
    // Skip header line (starts with '>')
    if (std::getline(file, line) && line[0] != '>') {
        std::cerr << "Error: Invalid FASTA format. Header line should start with '>'" << std::endl;
        return false;
    }
    
    // Read sequence lines
    while (std::getline(file, line)) {
        // Skip empty lines and comments
        if (line.empty() || line[0] == '>') {
            continue;
        }
        
        // Remove whitespace and convert to uppercase
        line.erase(std::remove_if(line.begin(), line.end(), ::isspace), line.end());
        std::transform(line.begin(), line.end(), line.begin(), ::toupper);
        
        // Validate DNA characters (A, C, G, T)
        for (char c : line) {
            if (c != 'A' && c != 'C' && c != 'G' && c != 'T') {
                std::cerr << "Warning: Non-standard DNA character '" << c << "' found in sequence" << std::endl;
            }
        }
        
        m_dna_sequence += line;
    }
    
    file.close();
    
    if (m_dna_sequence.empty()) {
        std::cerr << "Error: No DNA sequence found in file" << std::endl;
        return false;
    }
    
    std::cout << "Successfully loaded DNA sequence of length " << m_dna_sequence.size() << std::endl;
    return true;
}

void DNASearchEngine::search_pattern(const std::string& pattern, const std::string& algorithm) {
    m_pattern = pattern;
    m_algorithm = algorithm;
    m_comparisons = 0;
    
    // Convert pattern to uppercase
    std::string pattern_upper = pattern;
    std::transform(pattern_upper.begin(), pattern_upper.end(), pattern_upper.begin(), ::toupper);
    
    auto start_time = std::chrono::high_resolution_clock::now();
    
    if (algorithm == "KMP") {
        m_matches = kmp_search(m_dna_sequence, pattern_upper, m_comparisons);
    } else if (algorithm == "naive") {
        m_matches = naive_search(m_dna_sequence, pattern_upper, m_comparisons);
    } else {
        std::cerr << "Unknown algorithm: " << algorithm << ". Using KMP by default." << std::endl;
        m_algorithm = "KMP";
        m_matches = kmp_search(m_dna_sequence, pattern_upper, m_comparisons);
    }
    
    auto end_time = std::chrono::high_resolution_clock::now();
    m_execution_time_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();
    
    std::cout << "Pattern search complete using " << m_algorithm << " algorithm:" << std::endl;
    std::cout << "  - Found " << m_matches.size() << " matches" << std::endl;
    std::cout << "  - Performed " << m_comparisons << " comparisons" << std::endl;
    std::cout << "  - Execution time: " << m_execution_time_ms << " ms" << std::endl;
}

std::vector<int> DNASearchEngine::compute_prefix_function(const std::string& pattern) {
    int m = pattern.length();
    std::vector<int> pi(m, 0);
    
    for (int i = 1, k = 0; i < m; ++i) {
        while (k > 0 && pattern[k] != pattern[i]) {
            k = pi[k - 1];
        }
        
        if (pattern[k] == pattern[i]) {
            k++;
        }
        
        pi[i] = k;
    }
    
    return pi;
}

std::vector<int> DNASearchEngine::kmp_search(const std::string& text, const std::string& pattern, int& comparisons) {
    std::vector<int> matches;
    int n = text.length();
    int m = pattern.length();
    comparisons = 0;
    
    if (m == 0) {
        return matches;
    }
    
    if (n < m) {
        return matches;
    }
    
    // Compute prefix function for pattern
    std::vector<int> pi = compute_prefix_function(pattern);
    
    for (int i = 0, k = 0; i < n; ++i) {
        while (k > 0 && pattern[k] != text[i]) {
            k = pi[k - 1];
            comparisons++;
        }
        
        if (pattern[k] == text[i]) {
            k++;
        }
        comparisons++;
        
        if (k == m) {
            // Pattern found at index i - m + 1
            matches.push_back(i - m + 1);
            k = pi[k - 1];
        }
    }
    
    return matches;
}

std::vector<int> DNASearchEngine::naive_search(const std::string& text, const std::string& pattern, int& comparisons) {
    std::vector<int> matches;
    int n = text.length();
    int m = pattern.length();
    comparisons = 0;
    
    if (m == 0) {
        return matches;
    }
    
    if (n < m) {
        return matches;
    }
    
    for (int i = 0; i <= n - m; ++i) {
        bool match = true;
        
        for (int j = 0; j < m; ++j) {
            comparisons++;
            if (text[i + j] != pattern[j]) {
                match = false;
                break;
            }
        }
        
        if (match) {
            matches.push_back(i);
        }
    }
    
    return matches;
}

bool DNASearchEngine::export_results(const std::string& filename) {
    utils::JSONExporter exporter;
    
    exporter.add_int("dna_length", m_dna_sequence.size());
    exporter.add_string("pattern", m_pattern);
    exporter.add_int_array("matches", m_matches);
    exporter.add_int("comparisons", m_comparisons);
    exporter.add_double("execution_time_ms", m_execution_time_ms);
    exporter.add_string("algorithm", m_algorithm);
    
    return exporter.export_to_file(filename);
}

} // namespace dna
