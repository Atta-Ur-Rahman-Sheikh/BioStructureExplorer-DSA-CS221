#include "protein_parser.h"
#include <algorithm>
#include <cctype>

using namespace std;

namespace protein
{

    bool ProteinParser::load_pdb(const string &filename)
    {
        ifstream file(filename);
        if (!file.is_open())
        {
            cerr << "Error: Could not open file " << filename << endl;
            return false;
        }

        m_atoms.clear();
        m_chain_counts.clear();

        string line;

        // Extract PDB ID from filename
        size_t last_slash = filename.find_last_of("/\\");
        size_t start = (last_slash == string::npos) ? 0 : last_slash + 1;
        size_t dot = filename.find_last_of('.');
        m_pdb_id = filename.substr(start, dot - start);

        while (getline(file, line))
        {
            // Process ATOM records
            if (line.substr(0, 4) == "ATOM" || line.substr(0, 6) == "HETATM")
            {
                if (!parse_atom_record(line))
                {
                    cerr << "Warning: Failed to parse atom record: " << line << endl;
                }
            }
        }

        file.close();

        if (m_atoms.empty())
        {
            cerr << "Error: No valid atoms found in file" << endl;
            return false;
        }

        cout << "Successfully loaded protein structure with " << m_atoms.size() << " atoms" << endl;
        cout << "Chains found: ";
        for (const auto &[chain, count] : m_chain_counts)
        {
            cout << chain << " (" << count << " atoms) ";
        }
        cout << endl;

        return true;
    }

    bool ProteinParser::parse_atom_record(const string &line)
    {
        // Check if line is long enough
        if (line.length() < 54)
        {
            return false;
        }

        try
        {
            // Extract fields according to PDB format specification
            // Columns are 1-indexed in the PDB format

            int serial = stoi(line.substr(6, 5));

            string name = line.substr(12, 4);
            string residue = line.substr(17, 3);
            string chain = line.substr(21, 1);

            int residue_seq = stoi(line.substr(22, 4));

            double x = stod(line.substr(30, 8));
            double y = stod(line.substr(38, 8));
            double z = stod(line.substr(46, 8));

            // Element symbol (columns 77-78)
            string element;
            if (line.length() >= 78)
            {
                element = line.substr(76, 2);
                // Trim whitespace
                element.erase(remove_if(element.begin(), element.end(), ::isspace), element.end());
            }
            else
            {
                // Derive element from atom name
                element = name.substr(0, 1);
                if (element == " " && name.length() > 1)
                {
                    element = name.substr(1, 1);
                }
            }

            // Trim whitespace from strings
            name.erase(remove_if(name.begin(), name.end(), ::isspace), name.end());
            residue.erase(remove_if(residue.begin(), residue.end(), ::isspace), residue.end());
            chain.erase(remove_if(chain.begin(), chain.end(), ::isspace), chain.end());

            // Add atom to the list
            m_atoms.emplace_back(serial, name, element, residue, residue_seq, chain, x, y, z);

            // Update chain counts
            m_chain_counts[chain]++;

            return true;
        }
        catch (const exception &e)
        {
            cerr << "Error parsing atom record: " << e.what() << endl;
            return false;
        }
    }

    bool ProteinParser::export_results(const string &filename)
    {
        utils::JSONExporter exporter;

        // Add metadata
        exporter.add_string("pdb_id", m_pdb_id);
        exporter.add_int("atom_count", m_atoms.size());

        // Add chains information
        exporter.start_array("chains");
        for (const auto &[chain, count] : m_chain_counts)

        {
            map<string, string> chain_obj = {
                {"id", chain},
                {"atom_count", to_string(count)}};
            exporter.add_object_to_array(chain_obj, &chain == &m_chain_counts.rbegin()->first);
        }
        exporter.end_array();

        // Add atoms array
        exporter.start_array("atoms");
        for (size_t i = 0; i < m_atoms.size(); ++i)
        {
            const Atom &atom = m_atoms[i];
            map<string, string> atom_obj = {
                {"serial", to_string(atom.serial)},
                {"name", atom.name},
                {"element", atom.element},
                {"residue", atom.residue},
                {"residue_seq", to_string(atom.residue_seq)},
                {"chain", atom.chain},
                {"x", to_string(atom.x)},
                {"y", to_string(atom.y)},
                {"z", to_string(atom.z)}};
            exporter.add_object_to_array(atom_obj, i == m_atoms.size() - 1);
        }
        exporter.end_array();

        return exporter.export_to_file(filename);
    }

} // namespace protein
