let wasmModule = null;
let isLoading = false;
let loadPromise = null;

// Create JavaScript implementation (no WebAssembly files needed)
function createFallbackModule() {
  // Helper functions
  function toLowerCase(str) {
    return str.toLowerCase();
  }

  function cleanWord(word) {
    return word.replace(/[^\w]/g, "").toLowerCase();
  }

  function splitIntoWords(text) {
    return text
      .split(/\s+/)
      .map((word) => cleanWord(word))
      .filter((word) => word.length > 2);
  }

  // Advanced sentiment analysis
  function getSentimentScore(text) {
    if (!text) return 0.0;

    const str = toLowerCase(text);

    const positiveWords = {
      excellent: 3.0,
      amazing: 3.0,
      outstanding: 3.0,
      fantastic: 3.0,
      wonderful: 2.5,
      great: 2.0,
      good: 1.5,
      nice: 1.5,
      happy: 2.0,
      joy: 2.5,
      love: 2.5,
      like: 1.0,
      positive: 1.5,
      perfect: 2.5,
      brilliant: 2.5,
      superb: 2.5,
      awesome: 2.0,
      terrific: 2.0,
      magnificent: 2.5,
      delightful: 2.0,
    };

    const negativeWords = {
      terrible: -3.0,
      awful: -3.0,
      horrible: -3.0,
      disgusting: -3.0,
      bad: -2.0,
      poor: -1.5,
      sad: -1.5,
      angry: -2.0,
      hate: -2.5,
      dislike: -1.5,
      disappointed: -2.0,
      frustrated: -2.0,
      annoying: -1.5,
      boring: -1.0,
      worst: -3.0,
      useless: -2.5,
    };

    const intensifiers = {
      very: 1.5,
      extremely: 2.0,
      incredibly: 2.0,
      absolutely: 1.8,
      completely: 1.7,
      totally: 1.6,
      really: 1.3,
      quite: 1.2,
    };

    const words = splitIntoWords(str);
    let sentimentScore = 0.0;
    let intensifierMultiplier = 1.0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      if (intensifiers[word]) {
        intensifierMultiplier = intensifiers[word];
        continue;
      }

      if (positiveWords[word]) {
        sentimentScore += positiveWords[word] * intensifierMultiplier;
        intensifierMultiplier = 1.0;
      } else if (negativeWords[word]) {
        sentimentScore += negativeWords[word] * intensifierMultiplier;
        intensifierMultiplier = 1.0;
      } else {
        intensifierMultiplier = 1.0;
      }
    }

    const normalizedScore = sentimentScore / Math.max(1.0, words.length / 10.0);
    return Math.max(-1.0, Math.min(1.0, normalizedScore / 5.0));
  }

  // Advanced keyword extraction
  function extractKeywords(text, maxKeywords = 10) {
    if (!text) return "";

    const words = splitIntoWords(text);

    const stopWords = new Set([
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "up",
      "about",
      "into",
      "through",
      "during",
      "before",
      "after",
      "above",
      "below",
      "between",
      "among",
      "this",
      "that",
      "these",
      "those",
      "i",
      "me",
      "my",
      "myself",
      "we",
      "our",
      "ours",
      "ourselves",
      "you",
      "your",
      "yours",
      "yourself",
      "yourselves",
      "he",
      "him",
      "his",
      "himself",
      "she",
      "her",
      "hers",
      "herself",
      "it",
      "its",
      "itself",
      "they",
      "them",
      "their",
      "theirs",
      "themselves",
      "what",
      "which",
      "who",
      "whom",
      "whose",
      "this",
      "that",
      "these",
      "those",
      "am",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "having",
      "do",
      "does",
      "did",
      "doing",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "can",
      "shall",
    ]);

    const wordFreq = {};
    words.forEach((word) => {
      if (!stopWords.has(word) && word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    const keywordPairs = Object.entries(wordFreq)
      .sort(([, a], [, b]) => {
        if (a !== b) return b - a;
        return b.length - a.length;
      })
      .slice(0, maxKeywords);

    return keywordPairs.map(([word]) => word).join(",");
  }

  // Text complexity calculation
  function getComplexity(text) {
    if (!text) return 0.0;

    const words = splitIntoWords(text);
    if (words.length === 0) return 0.0;

    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    const avgWordLength = totalLength / words.length;

    const sentenceCount = Math.max(1, (text.match(/[.!?]/g) || []).length);
    const avgSentenceLength = words.length / sentenceCount;

    // Count syllables (simplified - count vowel groups)
    let totalSyllables = 0;
    words.forEach((word) => {
      let syllables = 0;
      let prevWasVowel = false;
      for (const char of word) {
        const isVowel = "aeiou".includes(char);
        if (isVowel && !prevWasVowel) {
          syllables++;
        }
        prevWasVowel = isVowel;
      }
      totalSyllables += Math.max(1, syllables);
    });

    // Flesch Reading Ease approximation (inverted and normalized)
    const fleschScore =
      206.835 -
      1.015 * avgSentenceLength -
      84.6 * (totalSyllables / words.length);
    const complexity = Math.max(
      0.0,
      Math.min(1.0, (100.0 - fleschScore) / 100.0)
    );

    return parseFloat(complexity.toFixed(3));
  }

  // Reading time calculation
  function getReadingTime(text) {
    if (!text) return 0;
    const wordCount = getWordCount(text);
    return Math.max(1, Math.ceil(wordCount / 225));
  }

  // Word count
  function getWordCount(text) {
    if (!text) return 0;
    return splitIntoWords(text).length;
  }

  // Module interface
  function createModule() {
    return Promise.resolve({
      ccall: function (funcName, returnType, argTypes, args) {
        switch (funcName) {
          case "getWordCount":
            return getWordCount(args[0]);
          case "getSentimentScore":
            return getSentimentScore(args[0]);
          case "extractKeywords":
            return extractKeywords(args[0], args[1] || 10);
          case "getComplexity":
            return getComplexity(args[0]);
          case "getReadingTime":
            return getReadingTime(args[0]);
          default:
            throw new Error(`Unknown function: ${funcName}`);
        }
      },

      cwrap: function (funcName, returnType, argTypes) {
        return function (...args) {
          return this.ccall(funcName, returnType, argTypes, args);
        }.bind(this);
      },

      UTF8ToString: function (ptr) {
        return ptr;
      },

      stringToUTF8: function (str, ptr) {
        return str;
      },
    });
  }

  return createModule;
}

// Load analysis module (using JavaScript implementation)
export async function loadWasmModule() {
  // Return existing module if already loaded
  if (wasmModule) {
    return wasmModule;
  }

  // Return existing promise if currently loading
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;

  loadPromise = new Promise(async (resolve, reject) => {
    try {
      console.log("🔄 Loading text analysis module...");

      // Use JavaScript implementation (no WebAssembly files needed)
      const TextAnalysisModule = createFallbackModule();
      console.log("✅ Using advanced JavaScript implementation");

      // Initialize the module
      wasmModule = await TextAnalysisModule();

      console.log("✅ Text analysis module ready");
      isLoading = false;
      resolve(wasmModule);
    } catch (error) {
      console.error("❌ Failed to load text analysis module:", error);
      isLoading = false;
      wasmModule = null;
      loadPromise = null;
      reject(error);
    }
  });

  return loadPromise;
}

// Text Analysis Functions
export class WasmTextAnalyzer {
  constructor() {
    this.module = null;
    this.ready = false;
  }

  async initialize() {
    if (this.ready) return;

    try {
      this.module = await loadWasmModule();
      this.ready = true;
      console.log("🎉 Text Analyzer ready");
    } catch (error) {
      console.error("❌ Failed to initialize Text Analyzer:", error);
      throw error;
    }
  }

  // Ensure module is loaded before use
  async ensureReady() {
    if (!this.ready) {
      await this.initialize();
    }
  }

  // Get word count
  async getWordCount(text) {
    await this.ensureReady();

    try {
      const result = this.module.ccall(
        "getWordCount",
        "number",
        ["string"],
        [text]
      );
      return result;
    } catch (error) {
      console.error("Error getting word count:", error);
      return this.fallbackWordCount(text);
    }
  }

  // Get sentiment score
  async getSentimentScore(text) {
    await this.ensureReady();

    try {
      const result = this.module.ccall(
        "getSentimentScore",
        "number",
        ["string"],
        [text]
      );
      return result;
    } catch (error) {
      console.error("Error getting sentiment score:", error);
      return this.fallbackSentiment(text);
    }
  }

  // Extract keywords
  async extractKeywords(text, maxKeywords = 10) {
    await this.ensureReady();

    try {
      const result = this.module.ccall(
        "extractKeywords",
        "string",
        ["string", "number"],
        [text, maxKeywords]
      );

      return result ? result.split(",") : [];
    } catch (error) {
      console.error("Error extracting keywords:", error);
      return this.fallbackKeywords(text);
    }
  }

  // Get text complexity
  async getComplexity(text) {
    await this.ensureReady();

    try {
      const result = this.module.ccall(
        "getComplexity",
        "number",
        ["string"],
        [text]
      );
      return result;
    } catch (error) {
      console.error("Error getting complexity:", error);
      return this.fallbackComplexity(text);
    }
  }

  // Get reading time
  async getReadingTime(text) {
    await this.ensureReady();

    try {
      const result = this.module.ccall(
        "getReadingTime",
        "number",
        ["string"],
        [text]
      );
      return result;
    } catch (error) {
      console.error("Error getting reading time:", error);
      return this.fallbackReadingTime(text);
    }
  }

  // Comprehensive analysis
  async analyzeText(text) {
    try {
      const [wordCount, sentiment, keywords, complexity, readingTime] =
        await Promise.all([
          this.getWordCount(text),
          this.getSentimentScore(text),
          this.extractKeywords(text),
          this.getComplexity(text),
          this.getReadingTime(text),
        ]);

      // Determine sentiment label
      let sentimentLabel = "NEUTRAL";
      if (sentiment > 0.1) sentimentLabel = "POSITIVE";
      else if (sentiment < -0.1) sentimentLabel = "NEGATIVE";

      return {
        wordCount,
        sentiment: parseFloat(sentiment.toFixed(3)),
        sentimentLabel,
        keywords,
        complexity: parseFloat(complexity.toFixed(3)),
        readingTime,
      };
    } catch (error) {
      console.error("Error in comprehensive analysis:", error);
      return this.fallbackAnalysis(text);
    }
  }

  // Fallback functions (in case main functions fail)
  fallbackWordCount(text) {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  fallbackSentiment(text) {
    const positiveWords = [
      "good",
      "great",
      "excellent",
      "amazing",
      "wonderful",
    ];
    const negativeWords = ["bad", "terrible", "awful", "horrible", "hate"];

    const textLower = text.toLowerCase();
    let score = 0;

    positiveWords.forEach((word) => {
      if (textLower.includes(word)) score += 0.2;
    });

    negativeWords.forEach((word) => {
      if (textLower.includes(word)) score -= 0.2;
    });

    return Math.max(-1, Math.min(1, score));
  }

  fallbackKeywords(text) {
    const words = text
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3);
    const freq = {};

    words.forEach((word) => {
      freq[word] = (freq[word] || 0) + 1;
    });

    return Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  fallbackComplexity(text) {
    const words = text.split(/\s+/);
    const avgLength =
      words.reduce((sum, word) => sum + word.length, 0) / words.length;
    return Math.min(1, avgLength / 10);
  }

  fallbackReadingTime(text) {
    const wordCount = this.fallbackWordCount(text);
    return Math.max(1, Math.ceil(wordCount / 225));
  }

  fallbackAnalysis(text) {
    const wordCount = this.fallbackWordCount(text);
    const sentiment = this.fallbackSentiment(text);
    const keywords = this.fallbackKeywords(text);
    const complexity = this.fallbackComplexity(text);
    const readingTime = this.fallbackReadingTime(text);

    let sentimentLabel = "NEUTRAL";
    if (sentiment > 0.1) sentimentLabel = "POSITIVE";
    else if (sentiment < -0.1) sentimentLabel = "NEGATIVE";

    return {
      wordCount,
      sentiment,
      sentimentLabel,
      keywords,
      complexity,
      readingTime,
    };
  }
}

// Create singleton instance
const wasmAnalyzer = new WasmTextAnalyzer();

export default wasmAnalyzer;
