#include "dna_search.h"
#include <algorithm>
#include <cctype>

using namespace std;
namespace dna
{

    bool DNASearchEngine::load_fasta(const string &filename)
    {
        ifstream file(filename);
        if (!file.is_open())
        {
            cerr << "Error: Could not open file " << filename << endl;
            return false;
        }

        string line;
        m_dna_sequence.clear();

        // Skip header line (starts with '>')
        if (getline(file, line) && line[0] != '>')
        {
            cerr << "Error: Invalid FASTA format. Header line should start with '>'" << endl;
            return false;
        }

        while (getline(file, line))
        {

            if (line.empty() || line[0] == '>')
            {
                continue;
            }

            // Remove whitespace and convert to uppercase
            line.erase(remove_if(line.begin(), line.end(), ::isspace), line.end());
            transform(line.begin(), line.end(), line.begin(), ::toupper);

            // Validate DNA characters (A, C, G, T)
            for (char c : line)
            {
                if (c != 'A' && c != 'C' && c != 'G' && c != 'T')
                {
                    cerr << "Warning: Non-standard DNA character '" << c << "' found in sequence" << endl;
                }
            }

            m_dna_sequence += line;
        }

        file.close();

        if (m_dna_sequence.empty())
        {
            cerr << "Error: No DNA sequence found in file" << endl;
            return false;
        }

        cout << "Successfully loaded DNA sequence of length " << m_dna_sequence.size() << endl;
        return true;
    }

    void DNASearchEngine::search_pattern(const string &pattern, const string &algorithm)
    {
        m_pattern = pattern;
        m_algorithm = algorithm;
        m_comparisons = 0;

        // Convert pattern to uppercase
        string pattern_upper = pattern;
        transform(pattern_upper.begin(), pattern_upper.end(), pattern_upper.begin(), ::toupper);

        auto start_time = chrono::high_resolution_clock::now();

        if (algorithm == "KMP")
        {
            m_matches = kmp_search(m_dna_sequence, pattern_upper, m_comparisons);
        }
        else if (algorithm == "naive")
        {
            m_matches = naive_search(m_dna_sequence, pattern_upper, m_comparisons);
        }
        else
        {
            cerr << "Unknown algorithm: " << algorithm << ". Using KMP by default." << endl;
            m_algorithm = "KMP";
            m_matches = kmp_search(m_dna_sequence, pattern_upper, m_comparisons);
        }

        auto end_time = chrono::high_resolution_clock::now();
        m_execution_time_ms = chrono::duration<double, milli>(end_time - start_time).count();

        cout << "Pattern search complete using " << m_algorithm << " algorithm:" << endl;
        cout << "  - Found " << m_matches.size() << " matches" << endl;
        cout << "  - Performed " << m_comparisons << " comparisons" << endl;
        cout << "  - Execution time: " << m_execution_time_ms << " ms" << endl;
    }

    vector<int> DNASearchEngine::compute_prefix_function(const string &pattern)
    {
        int m = pattern.length();
        vector<int> pi(m, 0);

        for (int i = 1, k = 0; i < m; ++i)
        {
            while (k > 0 && pattern[k] != pattern[i])
            {
                k = pi[k - 1];
            }

            if (pattern[k] == pattern[i])
            {
                k++;
            }

            pi[i] = k;
        }

        return pi;
    }

    vector<int> DNASearchEngine::kmp_search(const string &text, const string &pattern, int &comparisons)
    {
        vector<int> matches;
        int n = text.length();
        int m = pattern.length();
        comparisons = 0;

        if (m == 0)
        {
            return matches;
        }

        if (n < m)
        {
            return matches;
        }

        // Compute prefix function for pattern
        vector<int> pi = compute_prefix_function(pattern);

        for (int i = 0, k = 0; i < n; ++i) 
        {
            while (k > 0 && pattern[k] != text[i])
            {
                k = pi[k - 1];
                comparisons++;
            }

            if (pattern[k] == text[i])
            {
                k++;
            }
            comparisons++;

            if (k == m)
            {
                // Pattern found at index i - m + 1
                matches.push_back(i - m + 1);
                k = pi[k - 1];
            }
        }

        return matches;
    }

    vector<int> DNASearchEngine::naive_search(const string &text, const string &pattern, int &comparisons)
    {
        vector<int> matches;
        int n = text.length();
        int m = pattern.length();
        comparisons = 0;

        if (m == 0)
        {
            return matches;
        }

        if (n < m)
        {
            return matches;
        }

        for (int i = 0; i <= n - m; ++i)
        {
            bool match = true;

            for (int j = 0; j < m; ++j)
            {
                comparisons++;
                if (text[i + j] != pattern[j])
                {
                    match = false;
                    break;
                }
            }

            if (match)
            {
                matches.push_back(i);
            }
        }

        return matches;
    }

    bool DNASearchEngine::export_results(const string &filename)
    {
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
