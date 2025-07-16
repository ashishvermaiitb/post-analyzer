"use client";

import { useState } from "react";

export default function AnalysisPanel({ post, onAnalyze }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  // Get latest analysis from post data
  const latestAnalysis = post?.analysis?.[0] || null;

  const handleAnalyze = async () => {
    if (!post?.id) return;

    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${post.id}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze post");
      }

      const result = await response.json();
      setAnalysis(result.data);

      // Notify parent component
      if (onAnalyze) {
        onAnalyze(result.data);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const displayAnalysis = analysis || latestAnalysis;

  const getSentimentColor = (sentiment) => {
    if (sentiment > 0.1) return "text-green-600 bg-green-50";
    if (sentiment < -0.1) return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
  };

  const getSentimentIcon = (sentimentLabel) => {
    switch (sentimentLabel) {
      case "POSITIVE":
        return "😊";
      case "NEGATIVE":
        return "😞";
      default:
        return "😐";
    }
  };

  const getComplexityLevel = (complexity) => {
    if (complexity > 0.7)
      return { label: "High", color: "text-red-600 bg-red-50" };
    if (complexity > 0.4)
      return { label: "Medium", color: "text-yellow-600 bg-yellow-50" };
    return { label: "Low", color: "text-green-600 bg-green-50" };
  };

  return (
    <div className="border-t pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Text Analysis</h3>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {analyzing && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          )}
          {analyzing ? "Analyzing..." : "Analyze with C++"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {displayAnalysis ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Word Count */}
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Word Count
                </span>
                <span className="text-2xl">📝</span>
              </div>
              <span className="block text-2xl font-bold text-gray-900">
                {displayAnalysis.wordCount?.toLocaleString() || 0}
              </span>
            </div>

            {/* Sentiment */}
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Sentiment
                </span>
                <span className="text-2xl">
                  {getSentimentIcon(displayAnalysis.sentimentLabel)}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-lg font-bold text-gray-900 mr-2">
                  {(displayAnalysis.sentiment || 0).toFixed(2)}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getSentimentColor(
                    displayAnalysis.sentiment
                  )}`}
                >
                  {displayAnalysis.sentimentLabel || "NEUTRAL"}
                </span>
              </div>
            </div>

            {/* Reading Time */}
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Reading Time
                </span>
                <span className="text-2xl">⏱️</span>
              </div>
              <span className="block text-2xl font-bold text-gray-900">
                {displayAnalysis.readingTime || 0}
                <span className="text-sm font-normal text-gray-600 ml-1">
                  min
                </span>
              </span>
            </div>

            {/* Complexity */}
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Complexity
                </span>
                <span className="text-2xl">🧠</span>
              </div>
              <div className="flex items-center">
                <span className="text-lg font-bold text-gray-900 mr-2">
                  {((displayAnalysis.complexity || 0) * 100).toFixed(0)}%
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    getComplexityLevel(displayAnalysis.complexity).color
                  }`}
                >
                  {getComplexityLevel(displayAnalysis.complexity).label}
                </span>
              </div>
            </div>
          </div>

          {/* Keywords */}
          {displayAnalysis.keywords && displayAnalysis.keywords.length > 0 && (
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                <span className="mr-2">🔍</span>
                Key Topics
              </h4>
              <div className="flex flex-wrap gap-2">
                {displayAnalysis.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Metadata */}
          <div className="mt-4 text-xs text-gray-500 flex justify-between items-center">
            <span>
              Analysis performed:{" "}
              {new Date(displayAnalysis.createdAt).toLocaleString()}
            </span>
            {displayAnalysis.source && (
              <span className="bg-gray-200 px-2 py-1 rounded">
                Source:{" "}
                {displayAnalysis.source === "cpp_webassembly"
                  ? "C++ WebAssembly"
                  : "JavaScript Fallback"}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <div className="text-gray-400 mb-3">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-3">
            No analysis available for this post yet.
          </p>
          <p className="text-sm text-gray-500">
            Click "Analyze with C++" to generate detailed insights about this
            post's content using advanced text analysis algorithms.
          </p>
        </div>
      )}
    </div>
  );
}
