#!/bin/bash

echo "🔧 Building C++ text analysis module..."

# Create directories if they don't exist
mkdir -p public/wasm
mkdir -p cpp

# Check if emcc is available
if ! command -v emcc &> /dev/null; then
    echo "❌ Emscripten not found. Please install Emscripten first."
    echo "Visit: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

echo "✅ Emscripten found, compiling..."

# Compile C++ to WebAssembly
emcc cpp/text_analysis.cpp -o public/wasm/text_analysis.js \
    -s EXPORTED_FUNCTIONS='["_analyzeText", "_getWordCount", "_getSentimentScore", "_extractKeywords", "_getComplexity", "_getReadingTime", "_malloc", "_free"]' \
    -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "UTF8ToString", "stringToUTF8", "getValue", "setValue"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME='TextAnalysisModule' \
    -s ENVIRONMENT='web' \
    -O3 \
    --bind

if [ $? -eq 0 ]; then
    echo "✅ C++ compilation successful!"
    echo "📁 Files generated:"
    echo "   - public/wasm/text_analysis.js"
    echo "   - public/wasm/text_analysis.wasm"
    echo ""
    echo "🎉 WebAssembly module ready for use!"
else
    echo "❌ C++ compilation failed!"
    exit 1
fi