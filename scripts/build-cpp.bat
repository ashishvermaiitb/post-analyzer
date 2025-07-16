@echo off
REM scripts/build-cpp.bat

echo 🔧 Building C++ text analysis module...

REM Create directories if they don't exist
if not exist "public\wasm" mkdir "public\wasm"
if not exist "cpp" mkdir "cpp"

REM Check if emcc is available
where emcc >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Emscripten not found. Please install Emscripten first.
    echo Visit: https://emscripten.org/docs/getting_started/downloads.html
    echo.
    echo 💡 Alternative: Use the JavaScript fallback by running: npm run dev
    exit /b 1
)

echo ✅ Emscripten found, compiling...

REM Compile C++ to WebAssembly
emcc cpp/text_analysis.cpp -o public/wasm/text_analysis.js ^
    -s EXPORTED_FUNCTIONS="[\"_analyzeText\", \"_getWordCount\", \"_getSentimentScore\", \"_extractKeywords\", \"_getComplexity\", \"_getReadingTime\", \"_malloc\", \"_free\"]" ^
    -s EXPORTED_RUNTIME_METHODS="[\"ccall\", \"cwrap\", \"UTF8ToString\", \"stringToUTF8\", \"getValue\", \"setValue\"]" ^
    -s ALLOW_MEMORY_GROWTH=1 ^
    -s MODULARIZE=1 ^
    -s EXPORT_NAME="TextAnalysisModule" ^
    -s ENVIRONMENT="web" ^
    -O3 ^
    --bind

if %errorlevel% equ 0 (
    echo ✅ C++ compilation successful!
    echo 📁 Files generated:
    echo    - public/wasm/text_analysis.js
    echo    - public/wasm/text_analysis.wasm
    echo.
    echo 🎉 WebAssembly module ready for use!
) else (
    echo ❌ C++ compilation failed!
    echo 💡 You can still use the JavaScript fallback
    exit /b 1
)