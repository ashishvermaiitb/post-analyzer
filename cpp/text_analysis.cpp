#include <string>
#include <vector>
#include <unordered_map>
#include <algorithm>
#include <sstream>
#include <cctype>
#include <cmath>
#include <emscripten.h>

extern "C" {

// Structure to hold analysis results
struct AnalysisResult {
    int wordCount;
    float sentiment;
    int readingTime;
    float complexity;
};

// Helper function to convert string to lowercase
std::string toLowerCase(const std::string& str) {
    std::string result = str;
    std::transform(result.begin(), result.end(), result.begin(), ::tolower);
    return result;
}

// Helper function to clean word (remove punctuation)
std::string cleanWord(const std::string& word) {
    std::string result;
    for (char c : word) {
        if (std::isalnum(c)) {
            result += std::tolower(c);
        }
    }
    return result;
}

// Helper function to split string into words
std::vector<std::string> splitIntoWords(const std::string& text) {
    std::vector<std::string> words;
    std::istringstream iss(text);
    std::string word;
    
    while (iss >> word) {
        std::string cleanedWord = cleanWord(word);
        if (!cleanedWord.empty() && cleanedWord.length() > 2) {
            words.push_back(cleanedWord);
        }
    }
    
    return words;
}

// Advanced word count with filtering
EMSCRIPTEN_KEEPALIVE
int getWordCount(const char* text) {
    if (!text) return 0;
    
    std::string str(text);
    std::vector<std::string> words = splitIntoWords(str);
    
    return static_cast<int>(words.size());
}

// Advanced sentiment analysis with multiple techniques
EMSCRIPTEN_KEEPALIVE
float getSentimentScore(const char* text) {
    if (!text) return 0.0f;
    
    std::string str = toLowerCase(std::string(text));
    
    // Positive sentiment words with weights
    std::unordered_map<std::string, float> positiveWords = {
        {"excellent", 3.0f}, {"amazing", 3.0f}, {"outstanding", 3.0f}, {"fantastic", 3.0f},
        {"wonderful", 2.5f}, {"great", 2.0f}, {"good", 1.5f}, {"nice", 1.5f},
        {"happy", 2.0f}, {"joy", 2.5f}, {"love", 2.5f}, {"like", 1.0f},
        {"positive", 1.5f}, {"perfect", 2.5f}, {"brilliant", 2.5f}, {"superb", 2.5f},
        {"marvelous", 2.5f}, {"incredible", 2.5f}, {"awesome", 2.0f}, {"terrific", 2.0f}
    };
    
    // Negative sentiment words with weights
    std::unordered_map<std::string, float> negativeWords = {
        {"terrible", -3.0f}, {"awful", -3.0f}, {"horrible", -3.0f}, {"disgusting", -3.0f},
        {"bad", -2.0f}, {"poor", -1.5f}, {"sad", -1.5f}, {"angry", -2.0f},
        {"hate", -2.5f}, {"dislike", -1.5f}, {"disappointed", -2.0f}, {"frustrated", -2.0f},
        {"annoying", -1.5f}, {"boring", -1.0f}, {"worst", -3.0f}, {"useless", -2.5f},
        {"pathetic", -2.5f}, {"ridiculous", -2.0f}, {"stupid", -2.5f}, {"trash", -2.5f}
    };
    
    // Intensifiers
    std::unordered_map<std::string, float> intensifiers = {
        {"very", 1.5f}, {"extremely", 2.0f}, {"incredibly", 2.0f}, {"absolutely", 1.8f},
        {"completely", 1.7f}, {"totally", 1.6f}, {"really", 1.3f}, {"quite", 1.2f}
    };
    
    std::vector<std::string> words = splitIntoWords(str);
    float sentimentScore = 0.0f;
    float intensifierMultiplier = 1.0f;
    
    for (size_t i = 0; i < words.size(); i++) {
        const std::string& word = words[i];
        
        // Check for intensifiers
        if (intensifiers.find(word) != intensifiers.end()) {
            intensifierMultiplier = intensifiers[word];
            continue;
        }
        
        // Check positive words
        if (positiveWords.find(word) != positiveWords.end()) {
            sentimentScore += positiveWords[word] * intensifierMultiplier;
            intensifierMultiplier = 1.0f; // Reset after use
        }
        // Check negative words
        else if (negativeWords.find(word) != negativeWords.end()) {
            sentimentScore += negativeWords[word] * intensifierMultiplier;
            intensifierMultiplier = 1.0f; // Reset after use
        }
        else {
            intensifierMultiplier = 1.0f; // Reset if no sentiment word follows intensifier
        }
    }
    
    // Normalize sentiment score based on text length
    float normalizedScore = sentimentScore / std::max(1.0f, static_cast<float>(words.size()) / 10.0f);
    
    // Clamp to [-1, 1] range
    return std::max(-1.0f, std::min(1.0f, normalizedScore / 5.0f));
}

// Advanced keyword extraction using TF-IDF-like approach
EMSCRIPTEN_KEEPALIVE
char* extractKeywords(const char* text, int maxKeywords = 10) {
    if (!text) return nullptr;
    
    std::vector<std::string> words = splitIntoWords(std::string(text));
    
    // Common stop words to filter out
    std::unordered_set<std::string> stopWords = {
        "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from",
        "up", "about", "into", "through", "during", "before", "after", "above", "below",
        "between", "among", "this", "that", "these", "those", "i", "me", "my", "myself",
        "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves",
        "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself",
        "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom",
        "whose", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be",
        "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing",
        "will", "would", "could", "should", "may", "might", "must", "can", "shall"
    };
    
    // Count word frequencies
    std::unordered_map<std::string, int> wordFreq;
    for (const std::string& word : words) {
        if (stopWords.find(word) == stopWords.end() && word.length() > 3) {
            wordFreq[word]++;
        }
    }
    
    // Convert to vector for sorting
    std::vector<std::pair<std::string, int>> keywordPairs;
    for (const auto& pair : wordFreq) {
        keywordPairs.push_back(pair);
    }
    
    // Sort by frequency (descending) and then by length (descending for tie-breaking)
    std::sort(keywordPairs.begin(), keywordPairs.end(), 
              [](const std::pair<std::string, int>& a, const std::pair<std::string, int>& b) {
                  if (a.second != b.second) {
                      return a.second > b.second;
                  }
                  return a.first.length() > b.first.length();
              });
    
    // Build result string
    std::string result;
    int count = 0;
    for (const auto& pair : keywordPairs) {
        if (count >= maxKeywords) break;
        if (!result.empty()) result += ",";
        result += pair.first;
        count++;
    }
    
    // Allocate memory for result and copy
    char* resultPtr = (char*)malloc(result.length() + 1);
    strcpy(resultPtr, result.c_str());
    return resultPtr;
}

// Calculate text complexity using multiple metrics
EMSCRIPTEN_KEEPALIVE
float getComplexity(const char* text) {
    if (!text) return 0.0f;
    
    std::string str(text);
    std::vector<std::string> words = splitIntoWords(str);
    
    if (words.empty()) return 0.0f;
    
    // Calculate average word length
    float totalLength = 0.0f;
    for (const std::string& word : words) {
        totalLength += word.length();
    }
    float avgWordLength = totalLength / words.size();
    
    // Count sentences (approximate)
    int sentenceCount = std::count(str.begin(), str.end(), '.') + 
                       std::count(str.begin(), str.end(), '!') + 
                       std::count(str.begin(), str.end(), '?');
    sentenceCount = std::max(1, sentenceCount);
    
    // Calculate average sentence length
    float avgSentenceLength = static_cast<float>(words.size()) / sentenceCount;
    
    // Count syllables (simplified - count vowel groups)
    int totalSyllables = 0;
    for (const std::string& word : words) {
        int syllables = 0;
        bool prevWasVowel = false;
        for (char c : word) {
            bool isVowel = (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u');
            if (isVowel && !prevWasVowel) {
                syllables++;
            }
            prevWasVowel = isVowel;
        }
        totalSyllables += std::max(1, syllables);
    }
    
    // Flesch Reading Ease approximation (inverted and normalized)
    float fleschScore = 206.835f - (1.015f * avgSentenceLength) - (84.6f * (totalSyllables / static_cast<float>(words.size())));
    
    // Convert to complexity score (0-1, higher = more complex)
    float complexity = std::max(0.0f, std::min(1.0f, (100.0f - fleschScore) / 100.0f));
    
    return complexity;
}

// Calculate reading time in minutes
EMSCRIPTEN_KEEPALIVE
int getReadingTime(const char* text) {
    if (!text) return 0;
    
    int wordCount = getWordCount(text);
    
    // Average reading speed: 200-250 words per minute
    // Using 225 as middle ground
    int readingTime = std::max(1, static_cast<int>(std::ceil(wordCount / 225.0)));
    
    return readingTime;
}

// Main analysis function that returns comprehensive results
EMSCRIPTEN_KEEPALIVE
AnalysisResult* analyzeText(const char* text) {
    AnalysisResult* result = (AnalysisResult*)malloc(sizeof(AnalysisResult));
    
    if (!text || !result) {
        if (result) {
            result->wordCount = 0;
            result->sentiment = 0.0f;
            result->readingTime = 0;
            result->complexity = 0.0f;
        }
        return result;
    }
    
    result->wordCount = getWordCount(text);
    result->sentiment = getSentimentScore(text);
    result->readingTime = getReadingTime(text);
    result->complexity = getComplexity(text);
    
    return result;
}

} // extern "C"