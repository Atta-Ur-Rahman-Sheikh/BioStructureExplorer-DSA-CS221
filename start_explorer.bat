@echo off
echo BioStructure Explorer - DSA Project
echo ================================
echo.
echo This script will:
echo 1. Build the project
echo 2. Run the application
echo 3. Open the visualization in your browser
echo.

:: Check if build directory exists
if not exist "build" (
    echo Creating build directory...
    mkdir build
)

:: Navigate to build directory
cd build

:: Configure with CMake if CMakeCache.txt doesn't exist
if not exist "CMakeCache.txt" (
    echo Configuring project with CMake...
    cmake ..
    if %ERRORLEVEL% neq 0 (
        echo Error: CMake configuration failed.
        pause
        exit /b %ERRORLEVEL%
    )
)

:: Build the project
echo Building project...
cmake --build .
if %ERRORLEVEL% neq 0 (
    echo Error: Build failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Build successful!
echo.
echo Choose an option:
echo 1. Run the application
echo 2. Open the visualization
echo 3. Run the application and open the visualization
echo 4. Exit
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Running BioStructureExplorer...
    echo.
    BioStructureExplorer.exe
) else if "%choice%"=="2" (
    echo.
    echo Opening visualization in browser...
    cd ..
    start "" "visualization\index.html"
) else if "%choice%"=="3" (
    echo.
    echo Running BioStructureExplorer...
    echo.
    start "" BioStructureExplorer.exe
    echo.
    echo Opening visualization in browser...
    cd ..
    start "" "visualization\index.html"
) else if "%choice%"=="4" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice. Exiting...
)

pause
