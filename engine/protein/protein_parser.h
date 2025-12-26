#ifndef PROTEIN_PARSER_H
#define PROTEIN_PARSER_H

#include <string>
#include <vector>
#include <map>
#include <fstream>
#include <sstream>
#include <iostream>
#include <cmath>
#include "../utils/json_exporter.h"

using namespace std;

namespace protein
{


    struct Atom
    {
        int serial;          // Atom serial number
        std::string name;    // Atom name
        std::string element; // Element symbol
        std::string residue; // Residue name
        int residue_seq;     // Residue sequence number
        std::string chain;   // Chain identifier
        double x, y, z;      // 3D coordinates

        Atom(int ser, const std::string &nm, const std::string &elem,
             const std::string &res, int res_seq, const std::string &ch,
             double x_coord, double y_coord, double z_coord)
            : serial(ser), name(nm), element(elem), residue(res),
              residue_seq(res_seq), chain(ch), x(x_coord), y(y_coord), z(z_coord) {}
    };

    class ProteinParser
    {
    public:
        ProteinParser() = default;
        ~ProteinParser() = default;

        // Load protein structure from PDB file
        bool load_pdb(const std::string &filename);

        // Export results to JSON
        bool export_results(const std::string &filename);

        // Get atoms
        const std::vector<Atom> &get_atoms() const { return m_atoms; }

    private:
        std::string m_pdb_id;
        std::vector<Atom> m_atoms;
        std::map<std::string, int> m_chain_counts;

        // Parse ATOM record from PDB file
        bool parse_atom_record(const std::string &line);
    };

} // namespace protein

#endif // PROTEIN_PARSER_H

