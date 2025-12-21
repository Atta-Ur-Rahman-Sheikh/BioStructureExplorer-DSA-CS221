#include "protein_parser.h"
#include <algorithm>
#include <cctype>

namespace protein {

bool ProteinParser::load_pdb(const std::string& filename) {
    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cerr << "Error: Could not open file " << filename << std::endl;
        return false;
    }
    
    m_atoms.clear();
    m_chain_counts.clear();
    
    std::string line;
    
    // Extract PDB ID from filename
    size_t last_slash = filename.find_last_of("/\\");
    size_t start = (last_slash == std::string::npos) ? 0 : last_slash + 1;
    size_t dot = filename.find_last_of('.');
    m_pdb_id = filename.substr(start, dot - start);
    
    while (std::getline(file, line)) {
        // Process ATOM records
        if (line.substr(0, 4) == "ATOM" || line.substr(0, 6) == "HETATM") {
            if (!parse_atom_record(line)) {
                std::cerr << "Warning: Failed to parse atom record: " << line << std::endl;
            }
        }
    }
    
    file.close();
    
    if (m_atoms.empty()) {
        std::cerr << "Error: No valid atoms found in file" << std::endl;
        return false;
    }
    
    std::cout << "Successfully loaded protein structure with " << m_atoms.size() << " atoms" << std::endl;
    std::cout << "Chains found: ";
    for (const auto& [chain, count] : m_chain_counts) {
        std::cout << chain << " (" << count << " atoms) ";
    }
    std::cout << std::endl;
    
    return true;
}

bool ProteinParser::parse_atom_record(const std::string& line) {
    // Check if line is long enough
    if (line.length() < 54) {
        return false;
    }
    
    try {
        // Extract fields according to PDB format specification
        // Columns are 1-indexed in the PDB format
        int serial = std::stoi(line.substr(6, 5));
        std::string name = line.substr(12, 4);
        std::string residue = line.substr(17, 3);
        std::string chain = line.substr(21, 1);
        int residue_seq = std::stoi(line.substr(22, 4));
        
        double x = std::stod(line.substr(30, 8));
        double y = std::stod(line.substr(38, 8));
        double z = std::stod(line.substr(46, 8));
        
        // Element symbol (columns 77-78)
        std::string element;
        if (line.length() >= 78) {
            element = line.substr(76, 2);
            // Trim whitespace
            element.erase(std::remove_if(element.begin(), element.end(), ::isspace), element.end());
        } else {
            // Derive element from atom name
            element = name.substr(0, 1);
            if (element == " " && name.length() > 1) {
                element = name.substr(1, 1);
            }
        }
        
        // Trim whitespace from strings
        name.erase(std::remove_if(name.begin(), name.end(), ::isspace), name.end());
        residue.erase(std::remove_if(residue.begin(), residue.end(), ::isspace), residue.end());
        chain.erase(std::remove_if(chain.begin(), chain.end(), ::isspace), chain.end());
        
        // Add atom to the list
        m_atoms.emplace_back(serial, name, element, residue, residue_seq, chain, x, y, z);
        
        // Update chain counts
        m_chain_counts[chain]++;
        
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Error parsing atom record: " << e.what() << std::endl;
        return false;
    }
}

bool ProteinParser::export_results(const std::string& filename) {
    utils::JSONExporter exporter;
    
    // Add metadata
    exporter.add_string("pdb_id", m_pdb_id);
    exporter.add_int("atom_count", m_atoms.size());
    
    // Add chains information
    exporter.start_array("chains");
    for (const auto& [chain, count] : m_chain_counts) {
        std::map<std::string, std::string> chain_obj = {
            {"id", chain},
            {"atom_count", std::to_string(count)}
        };
        exporter.add_object_to_array(chain_obj, &chain == &m_chain_counts.rbegin()->first);
    }
    exporter.end_array();
    
    // Add atoms array
    exporter.start_array("atoms");
    for (size_t i = 0; i < m_atoms.size(); ++i) {
        const Atom& atom = m_atoms[i];
        std::map<std::string, std::string> atom_obj = {
            {"serial", std::to_string(atom.serial)},
            {"name", atom.name},
            {"element", atom.element},
            {"residue", atom.residue},
            {"residue_seq", std::to_string(atom.residue_seq)},
            {"chain", atom.chain},
            {"x", std::to_string(atom.x)},
            {"y", std::to_string(atom.y)},
            {"z", std::to_string(atom.z)}
        };
        exporter.add_object_to_array(atom_obj, i == m_atoms.size() - 1);
    }
    exporter.end_array();
    
    return exporter.export_to_file(filename);
}

} // namespace protein
