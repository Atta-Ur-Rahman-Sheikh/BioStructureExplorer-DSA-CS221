cmake_minimum_required(VERSION 3.10)
project(BioStructureExplorer VERSION 1.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Include directories
include_directories(${CMAKE_SOURCE_DIR})

# Check for filesystem support
include(CheckIncludeFileCXX)
check_include_file_cxx("filesystem" HAVE_STD_FILESYSTEM)
if(NOT HAVE_STD_FILESYSTEM)
    check_include_file_cxx("experimental/filesystem" HAVE_STD_EXPERIMENTAL_FILESYSTEM)
    if(HAVE_STD_EXPERIMENTAL_FILESYSTEM)
        add_definitions(-DUSE_EXPERIMENTAL_FILESYSTEM)
    else()
        message(FATAL_ERROR "No filesystem support found")
    endif()
endif()

# Link filesystem library if needed
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU")
    link_libraries(stdc++fs)
endif()

# Add source files
file(GLOB_RECURSE SOURCES 
    "engine/dna/*.cpp"
    "engine/graph/*.cpp"
    "engine/evolution/*.cpp"
    "engine/protein/*.cpp"
    "engine/utils/*.cpp"
)

# Add header files
file(GLOB_RECURSE HEADERS 
    "engine/dna/*.h"
    "engine/graph/*.h"
    "engine/evolution/*.h"
    "engine/protein/*.h"
    "engine/utils/*.h"
)

# Create executable
add_executable(BioStructureExplorer main.cpp ${SOURCES} ${HEADERS})

