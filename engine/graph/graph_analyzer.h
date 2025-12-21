#ifndef GRAPH_ANALYZER_H
#define GRAPH_ANALYZER_H

#include <string>
#include <vector>
#include <map>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <fstream>
#include <sstream>
#include <iostream>
#include "../utils/json_exporter.h"

using namespace std;

namespace graph
{

    // Edge structure to represent interaction between two nodes
    struct Edge
    {
        string source;
        string target;
        double weight; // Optional weight/confidence value

        Edge(const string &src, const string &tgt, double w = 1.0)
            : source(src), target(tgt), weight(w) {}
    };

    // Node structure to represent a gene/protein
    struct Node
    {
        string id;
        int degree;
        double centrality;

        Node() : id(""), degree(0), centrality(0.0) {}

        Node(const string &nodeId)
            : id(nodeId), degree(0), centrality(0.0) {}
    };

    class GraphAnalyzer
    {
    public:
        GraphAnalyzer() = default;
        ~GraphAnalyzer() = default;

        // Load interactions from CSV file
        bool load_interactions(const string &filename);

        // Analyze the graph starting from a specific node
        void analyze(const string &start_node);

        // Export results to JSON
        bool export_results(const string &filename);

    private:
        // Adjacency list representation of the graph
        unordered_map<string, vector<string>> m_adjacency_list;

        // Store nodes and edges
        map<string, Node> m_nodes;
        vector<Edge> m_edges;

        // Store traversal results
        vector<string> m_bfs_order;
        vector<string> m_dfs_order;

        // Graph analysis methods
        void calculate_degree_centrality();
        vector<string> bfs_traversal(const string &start_node);
        vector<string> dfs_traversal(const string &start_node);
        void dfs_helper(const string &node, unordered_set<string> &visited, vector<string> &result);

        // shortest path calculation
        vector<string> shortest_path(const string &source, const string &target);
    };

} // namespace graph

#endif // GRAPH_ANALYZER_H
