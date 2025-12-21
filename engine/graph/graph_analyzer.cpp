#include "graph_analyzer.h"
#include <algorithm>

namespace graph {

bool GraphAnalyzer::load_interactions(const std::string& filename) {
    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cerr << "Error: Could not open file " << filename << std::endl;
        return false;
    }
    
    m_adjacency_list.clear();
    m_nodes.clear();
    m_edges.clear();
    
    std::string line;
    int line_number = 0;
    
    while (std::getline(file, line)) {
        line_number++;
        
        // Skip empty lines
        if (line.empty()) {
            continue;
        }
        
        // Skip header line
        if (line_number == 1 && (line.find("source") != std::string::npos || line.find("target") != std::string::npos)) {
            continue;
        }
        
        std::stringstream ss(line);
        std::string source, target;
        double weight = 1.0;
        
        // Parse CSV format
        if (std::getline(ss, source, ',') && std::getline(ss, target, ',')) {
            // Optional weight column
            std::string weight_str;
            if (std::getline(ss, weight_str, ',')) {
                try {
                    weight = std::stod(weight_str);
                } catch (const std::exception& e) {
                    std::cerr << "Warning: Invalid weight value on line " << line_number << ". Using default weight of 1.0." << std::endl;
                }
            }
            
            // Add edge to the graph
            m_adjacency_list[source].push_back(target);
            m_adjacency_list[target].push_back(source); // Undirected graph
            
            // Add nodes if they don't exist
            if (m_nodes.find(source) == m_nodes.end()) {
                m_nodes[source] = Node(source);
            }
            if (m_nodes.find(target) == m_nodes.end()) {
                m_nodes[target] = Node(target);
            }
            
            // Add edge
            m_edges.emplace_back(source, target, weight);
        } else {
            std::cerr << "Warning: Invalid format on line " << line_number << ". Expected 'source,target' format." << std::endl;
        }
    }
    
    file.close();
    
    if (m_nodes.empty()) {
        std::cerr << "Error: No valid interactions found in file" << std::endl;
        return false;
    }
    
    std::cout << "Successfully loaded " << m_nodes.size() << " nodes and " << m_edges.size() << " interactions" << std::endl;
    return true;
}

void GraphAnalyzer::analyze(const std::string& start_node) {
    // Calculate degree centrality
    calculate_degree_centrality();
    
    // Perform BFS traversal
    if (!start_node.empty() && m_nodes.find(start_node) != m_nodes.end()) {
        m_bfs_order = bfs_traversal(start_node);
        m_dfs_order = dfs_traversal(start_node);
        
        std::cout << "Graph analysis complete:" << std::endl;
        std::cout << "  - BFS traversal from " << start_node << " visited " << m_bfs_order.size() << " nodes" << std::endl;
        std::cout << "  - DFS traversal from " << start_node << " visited " << m_dfs_order.size() << " nodes" << std::endl;
    } else {
        std::cerr << "Warning: Start node '" << start_node << "' not found in graph. Skipping traversals." << std::endl;
    }
}

void GraphAnalyzer::calculate_degree_centrality() {
    // Calculate degree for each node
    for (auto& [node_id, node] : m_nodes) {
        node.degree = m_adjacency_list[node_id].size();
    }
    
    // Calculate degree centrality (normalized by n-1 where n is the number of nodes)
    int n = m_nodes.size();
    if (n > 1) {
        double normalization_factor = 1.0 / (n - 1);
        for (auto& [node_id, node] : m_nodes) {
            node.centrality = node.degree * normalization_factor;
        }
    }
}

std::vector<std::string> GraphAnalyzer::bfs_traversal(const std::string& start_node) {
    std::vector<std::string> result;
    std::unordered_set<std::string> visited;
    std::queue<std::string> queue;
    
    // Start BFS from the given node
    queue.push(start_node);
    visited.insert(start_node);
    
    while (!queue.empty()) {
        std::string current = queue.front();
        queue.pop();
        result.push_back(current);
        
        // Visit all adjacent nodes
        for (const std::string& neighbor : m_adjacency_list[current]) {
            if (visited.find(neighbor) == visited.end()) {
                visited.insert(neighbor);
                queue.push(neighbor);
            }
        }
    }
    
    return result;
}

std::vector<std::string> GraphAnalyzer::dfs_traversal(const std::string& start_node) {
    std::vector<std::string> result;
    std::unordered_set<std::string> visited;
    
    dfs_helper(start_node, visited, result);
    
    return result;
}

void GraphAnalyzer::dfs_helper(const std::string& node, std::unordered_set<std::string>& visited, std::vector<std::string>& result) {
    visited.insert(node);
    result.push_back(node);
    
    // Visit all adjacent nodes
    for (const std::string& neighbor : m_adjacency_list[node]) {
        if (visited.find(neighbor) == visited.end()) {
            dfs_helper(neighbor, visited, result);
        }
    }
}

std::vector<std::string> GraphAnalyzer::shortest_path(const std::string& source, const std::string& target) {
    std::vector<std::string> path;
    
    // Check if source and target exist
    if (m_nodes.find(source) == m_nodes.end() || m_nodes.find(target) == m_nodes.end()) {
        return path;
    }
    
    // BFS to find shortest path
    std::unordered_map<std::string, std::string> prev;
    std::unordered_set<std::string> visited;
    std::queue<std::string> queue;
    
    queue.push(source);
    visited.insert(source);
    
    bool found = false;
    while (!queue.empty() && !found) {
        std::string current = queue.front();
        queue.pop();
        
        if (current == target) {
            found = true;
            break;
        }
        
        for (const std::string& neighbor : m_adjacency_list[current]) {
            if (visited.find(neighbor) == visited.end()) {
                visited.insert(neighbor);
                prev[neighbor] = current;
                queue.push(neighbor);
            }
        }
    }
    
    // Reconstruct path if found
    if (found) {
        std::string current = target;
        while (current != source) {
            path.push_back(current);
            current = prev[current];
        }
        path.push_back(source);
        
        // Reverse to get path from source to target
        std::reverse(path.begin(), path.end());
    }
    
    return path;
}

bool GraphAnalyzer::export_results(const std::string& filename) {
    utils::JSONExporter exporter;
    
    // Add nodes array
    exporter.start_array("nodes");
    size_t node_count = 0;
    for (const auto& [node_id, node] : m_nodes) {
        std::map<std::string, std::string> node_obj = {
            {"id", node_id},
            {"degree", std::to_string(node.degree)},
            {"centrality", std::to_string(node.centrality)}
        };
        node_count++;
        exporter.add_object_to_array(node_obj, node_count == m_nodes.size());
    }
    exporter.end_array();
    
    // Add edges array
    exporter.start_array("edges");
    for (size_t i = 0; i < m_edges.size(); ++i) {
        const Edge& edge = m_edges[i];
        std::map<std::string, std::string> edge_obj = {
            {"source", edge.source},
            {"target", edge.target},
            {"weight", std::to_string(edge.weight)}
        };
        exporter.add_object_to_array(edge_obj, i == m_edges.size() - 1);
    }
    exporter.end_array();
    
    // Add BFS traversal
    exporter.add_string_array("bfs_order", m_bfs_order);
    
    // Add DFS traversal
    exporter.add_string_array("dfs_order", m_dfs_order);
    
    return exporter.export_to_file(filename);
}

} // namespace graph
