import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  withAuth,
  createErrorResponse,
  createSuccessResponse,
  setCorsHeaders,
} from "../../../../../lib/middleware.js";
import wasmAnalyzer from "../../../../../lib/wasm-loader.js";

const prisma = new PrismaClient();

// POST /api/posts/[id]/analyze - Analyze post content (requires API key)
export async function POST(request, { params }) {
  try {
    // Validate API key and permissions
    const authResult = await withAuth(request, "ANALYZE_POST");
    if (!authResult.success) {
      const response = createErrorResponse(authResult.error, authResult.status);
      return setCorsHeaders(response);
    }

    const { id } = await params; // Await params in Next.js 15

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
    });

    if (!post) {
      const response = createErrorResponse("Post not found", 404);
      return setCorsHeaders(response);
    }

    console.log("🔍 Analyzing post with advanced text analysis...");

    // Analyze text using advanced JavaScript implementation
    const analysis = await wasmAnalyzer.analyzeText(post.body);

    console.log("✅ Analysis completed:", {
      wordCount: analysis.wordCount,
      sentiment: analysis.sentiment,
      sentimentLabel: analysis.sentimentLabel,
      keywordCount: analysis.keywords.length,
      complexity: analysis.complexity,
      readingTime: analysis.readingTime,
    });

    // Save analysis to database
    const savedAnalysis = await prisma.postAnalysis.create({
      data: {
        postId: parseInt(id),
        wordCount: analysis.wordCount,
        sentiment: analysis.sentiment,
        sentimentLabel: analysis.sentimentLabel,
        keywords: analysis.keywords,
        readingTime: analysis.readingTime,
        complexity: analysis.complexity,
      },
    });

    // Return analysis with metadata
    const response = createSuccessResponse(
      {
        ...savedAnalysis,
        source: "advanced_javascript",
        analysisTime: new Date().toISOString(),
      },
      201
    );

    return setCorsHeaders(response);
  } catch (error) {
    console.error("❌ Error analyzing post:", error);

    // Fallback to simple analysis if advanced analysis fails
    try {
      console.log("🔄 Falling back to simple analysis...");

      const { id } = await params;
      const post = await prisma.post.findUnique({
        where: { id: parseInt(id) },
      });

      const fallbackAnalysis = analyzeTextFallback(post.body);

      const savedAnalysis = await prisma.postAnalysis.create({
        data: {
          postId: parseInt(id),
          wordCount: fallbackAnalysis.wordCount,
          sentiment: fallbackAnalysis.sentiment,
          sentimentLabel: fallbackAnalysis.sentimentLabel,
          keywords: fallbackAnalysis.keywords,
          readingTime: fallbackAnalysis.readingTime,
          complexity: fallbackAnalysis.complexity,
        },
      });

      const response = createSuccessResponse(
        {
          ...savedAnalysis,
          source: "fallback_javascript",
          warning: "Advanced analysis failed, used basic fallback",
          analysisTime: new Date().toISOString(),
        },
        201
      );

      return setCorsHeaders(response);
    } catch (fallbackError) {
      console.error("❌ Fallback analysis also failed:", fallbackError);
      const response = createErrorResponse("Failed to analyze post", 500);
      return setCorsHeaders(response);
    }
  }
}

// GET /api/posts/[id]/analyze - Get latest analysis
export async function GET(request, { params }) {
  try {
    const { id } = await params; // Await params in Next.js 15

    const analysis = await prisma.postAnalysis.findFirst({
      where: { postId: parseInt(id) },
      orderBy: { createdAt: "desc" },
    });

    if (!analysis) {
      const response = createErrorResponse(
        "No analysis found for this post",
        404
      );
      return setCorsHeaders(response);
    }

    const response = createSuccessResponse(analysis);
    return setCorsHeaders(response);
  } catch (error) {
    console.error("Error fetching analysis:", error);
    const response = createErrorResponse("Failed to fetch analysis", 500);
    return setCorsHeaders(response);
  }
}

// Simple fallback analysis function
function analyzeTextFallback(text) {
  if (!text) {
    return {
      wordCount: 0,
      sentiment: 0,
      sentimentLabel: "NEUTRAL",
      keywords: [],
      readingTime: 0,
      complexity: 0,
    };
  }

  // Basic word count
  const words = text.trim().split(/\s+/);
  const wordCount = words.length;

  // Simple sentiment analysis
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "wonderful",
    "fantastic",
    "love",
    "like",
    "happy",
    "joy",
  ];
  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "hate",
    "dislike",
    "sad",
    "angry",
    "frustrated",
  ];

  const textLower = text.toLowerCase();
  let sentimentScore = 0;

  positiveWords.forEach((word) => {
    if (textLower.includes(word)) sentimentScore += 1;
  });

  negativeWords.forEach((word) => {
    if (textLower.includes(word)) sentimentScore -= 1;
  });

  // Normalize sentiment score
  const normalizedSentiment = Math.max(-1, Math.min(1, sentimentScore / 10));

  let sentimentLabel = "NEUTRAL";
  if (normalizedSentiment > 0.1) sentimentLabel = "POSITIVE";
  else if (normalizedSentiment < -0.1) sentimentLabel = "NEGATIVE";

  // Extract keywords (simple frequency analysis)
  const wordFreq = {};
  words.forEach((word) => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, "");
    if (cleanWord.length > 3) {
      wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
    }
  });

  const keywords = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);

  // Estimate reading time (average 225 words per minute)
  const readingTime = Math.ceil(wordCount / 225);

  // Simple complexity score (based on average word length)
  const avgWordLength =
    words.reduce((sum, word) => sum + word.length, 0) / wordCount;
  const complexity = Math.min(1, avgWordLength / 10);

  return {
    wordCount,
    sentiment: normalizedSentiment,
    sentimentLabel,
    keywords,
    readingTime,
    complexity: parseFloat(complexity.toFixed(2)),
  };
}

// OPTIONS /api/posts/[id]/analyze - Handle CORS preflight
export async function OPTIONS(request) {
  return setCorsHeaders(new Response(null, { status: 200 }));
}
