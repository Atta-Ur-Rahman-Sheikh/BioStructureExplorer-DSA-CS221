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

namespace graph {

// Edge structure to represent interaction between two nodes
struct Edge {
    std::string source;
    std::string target;
    double weight; // Optional weight/confidence value
    
    Edge(const std::string& src, const std::string& tgt, double w = 1.0)
        : source(src), target(tgt), weight(w) {}
};

// Node structure to represent a gene/protein
struct Node {
    std::string id;
    int degree;
    double centrality;
    
    Node() : id(""), degree(0), centrality(0.0) {}
    
    Node(const std::string& nodeId)
        : id(nodeId), degree(0), centrality(0.0) {}
};

class GraphAnalyzer {
public:
    GraphAnalyzer() = default;
    ~GraphAnalyzer() = default;
    
    // Load interactions from CSV file
    bool load_interactions(const std::string& filename);
    
    // Analyze the graph starting from a specific node
    void analyze(const std::string& start_node);
    
    // Export results to JSON
    bool export_results(const std::string& filename);
    
private:
    // Adjacency list representation of the graph
    std::unordered_map<std::string, std::vector<std::string>> m_adjacency_list;
    
    // Store nodes and edges
    std::map<std::string, Node> m_nodes;
    std::vector<Edge> m_edges;
    
    // Store traversal results
    std::vector<std::string> m_bfs_order;
    std::vector<std::string> m_dfs_order;
    
    // Graph analysis methods
    void calculate_degree_centrality();
    std::vector<std::string> bfs_traversal(const std::string& start_node);
    std::vector<std::string> dfs_traversal(const std::string& start_node);
    void dfs_helper(const std::string& node, std::unordered_set<std::string>& visited, std::vector<std::string>& result);
    
    // Optional: shortest path calculation
    std::vector<std::string> shortest_path(const std::string& source, const std::string& target);
};

} // namespace graph

#endif // GRAPH_ANALYZER_H
