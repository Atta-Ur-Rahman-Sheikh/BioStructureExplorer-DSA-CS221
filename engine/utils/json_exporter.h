#ifndef JSON_EXPORTER_H
#define JSON_EXPORTER_H

#include <string>
#include <vector>
#include <map>
#include <fstream>
#include <iostream>

namespace utils
{

    class JSONExporter
    {
    public:
        JSONExporter()
        {
            m_json_data = "{\n";
            m_indent_level = 1;
        }

        ~JSONExporter() = default;

        // Add a simple key-value pair (for strings)
        void add_string(const std::string &key, const std::string &value)
        {
            add_indent();
            m_json_data += "\"" + key + "\": \"" + value + "\",\n";
        }

        // Add a simple key-value pair (for integers)
        void add_int(const std::string &key, int value)
        {
            add_indent();
            m_json_data += "\"" + key + "\": " + std::to_string(value) + ",\n";
        }

        // Add a simple key-value pair (for doubles)
        void add_double(const std::string &key, double value)
        {
            add_indent();
            m_json_data += "\"" + key + "\": " + std::to_string(value) + ",\n";
        }

        // Add a simple key-value pair (for booleans)
        void add_bool(const std::string &key, bool value)
        {
            add_indent();
            m_json_data += "\"" + key + "\": " + (value ? "true" : "false") + ",\n";
        }

        // Add an array of integers
        void add_int_array(const std::string &key, const std::vector<int> &values)
        {
            add_indent();
            m_json_data += "\"" + key + "\": [\n";
            m_indent_level++;

            for (size_t i = 0; i < values.size(); ++i)
            {
                add_indent();
                m_json_data += std::to_string(values[i]);
                if (i < values.size() - 1)
                {
                    m_json_data += ",";
                }
                m_json_data += "\n";
            }

            m_indent_level--;
            add_indent();
            m_json_data += "],\n";
        }

        // Add an array of strings
        void add_string_array(const std::string &key, const std::vector<std::string> &values)
        {
            add_indent();
            m_json_data += "\"" + key + "\": [\n";
            m_indent_level++;

            for (size_t i = 0; i < values.size(); ++i)
            {
                add_indent();
                m_json_data += "\"" + values[i] + "\"";
                if (i < values.size() - 1)
                {
                    m_json_data += ",";
                }
                m_json_data += "\n";
            }

            m_indent_level--;
            add_indent();
            m_json_data += "],\n";
        }

        // Add a 2D grid (for mutation simulator)
        void add_grid(const std::string &key, const std::vector<std::vector<int>> &grid)
        {
            add_indent();
            m_json_data += "\"" + key + "\": [\n";
            m_indent_level++;

            for (size_t i = 0; i < grid.size(); ++i)
            {
                add_indent();
                m_json_data += "[\n";
                m_indent_level++;

                for (size_t j = 0; j < grid[i].size(); ++j)
                {
                    add_indent();
                    m_json_data += std::to_string(grid[i][j]);
                    if (j < grid[i].size() - 1)
                    {
                        m_json_data += ",";
                    }
                    m_json_data += "\n";
                }

                m_indent_level--;
                add_indent();
                m_json_data += "]";
                if (i < grid.size() - 1)
                {
                    m_json_data += ",";
                }
                m_json_data += "\n";
            }

            m_indent_level--;
            add_indent();
            m_json_data += "],\n";
        }

        // Start a new object array
        void start_array(const std::string &key)
        {
            add_indent();
            m_json_data += "\"" + key + "\": [\n";
            m_indent_level++;
        }

        // Add an object to the current array
        void add_object_to_array(const std::map<std::string, std::string> &obj, bool is_last = false)
        {
            add_indent();
            m_json_data += "{\n";
            m_indent_level++;

            size_t count = 0;
            for (const auto &[key, value] : obj)
            {
                add_indent();
                // Check if the value is a number (no quotes)
                bool is_numeric = true;
                for (char c : value)
                {
                    if (!isdigit(c) && c != '.' && c != '-')
                    {
                        is_numeric = false;
                        break;
                    }
                }

                if (is_numeric)
                {
                    m_json_data += "\"" + key + "\": " + value;
                }
                else
                {
                    m_json_data += "\"" + key + "\": \"" + value + "\"";
                }

                if (count < obj.size() - 1)
                {
                    m_json_data += ",";
                }
                m_json_data += "\n";
                count++;
            }

            m_indent_level--;
            add_indent();
            m_json_data += "}";
            if (!is_last)
            {
                m_json_data += ",";
            }
            m_json_data += "\n";
        }

        // End the current array
        void end_array()
        {
            m_indent_level--;
            add_indent();
            m_json_data += "],\n";
        }

        // Export the JSON data to a file
        bool export_to_file(const std::string &filename)
        {
            try
            {
                // Create directory if it doesn't exist
                size_t last_slash = filename.find_last_of("/\\");
                if (last_slash != std::string::npos)
                {
                    std::string dir = filename.substr(0, last_slash);
// Create directory using system command (cross-platform)
#ifdef _WIN32
                    std::string cmd = "mkdir \"" + dir + "\" 2> nul";
#else
                    std::string cmd = "mkdir -p \"" + dir + "\"";
#endif
                    system(cmd.c_str());
                }

                // Remove the last comma and newline
                if (m_json_data.size() > 2)
                {
                    m_json_data.erase(m_json_data.size() - 2, 2);
                    m_json_data += "\n";
                }

                // Close the JSON object
                m_json_data += "}\n";

                std::ofstream file(filename);
                if (!file.is_open())
                {
                    std::cerr << "Failed to open file: " << filename << std::endl;
                    return false;
                }

                file << m_json_data;
                file.close();
                return true;
            }
            catch (const std::exception &e)
            {
                std::cerr << "Error exporting JSON: " << e.what() << std::endl;
                return false;
            }
        }

    private:
        std::string m_json_data;
        int m_indent_level;

        void add_indent()
        {
            for (int i = 0; i < m_indent_level; ++i)
            {
                m_json_data += "  "; // Two spaces per indent level
            }
        }
    };

} // namespace utils

#endif // JSON_EXPORTER_H
