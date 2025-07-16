"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePost } from "../../../hooks/usePosts";
import AnalysisPanel from "../../../components/AnalysisPanel";

export default function PostDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { post, loading, error, updatePost } = usePost(id);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Update title state when post loads
  useEffect(() => {
    if (post) {
      setTitle(post.title);
    }
  }, [post]);

  const handleUpdatePost = async () => {
    if (!title.trim()) {
      alert("Title cannot be empty");
      return;
    }

    try {
      setSaving(true);
      await updatePost({ title: title.trim() });
      setEditing(false);
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post");
    } finally {
      setSaving(false);
    }
  };

  const handleAnalysisComplete = (analysisData) => {
    // Optionally refresh the post data to get updated analysis
    console.log("Analysis completed:", analysisData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-center h-64">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-gray-700 font-medium">Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4">
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6 max-w-md mx-auto">
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
            <button
              onClick={() => router.push("/")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Post not found
            </h1>
            <button
              onClick={() => router.push("/")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {editing ? (
            <div className="mb-6">
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Edit Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                placeholder="Enter post title..."
                disabled={saving}
                style={{ color: "#111827", backgroundColor: "#ffffff" }}
              />
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={handleUpdatePost}
                  disabled={saving}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setTitle(post.title);
                  }}
                  disabled={saving}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {post.title}
                </h1>
                <button
                  onClick={() => setEditing(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                >
                  Edit Title
                </button>
              </div>
              {post.user && (
                <p className="text-sm text-gray-600">
                  By <span className="font-medium">{post.user.name}</span> (@
                  {post.user.username})
                </p>
              )}
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Content
            </h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border">
                {post.body}
              </p>
            </div>
          </div>

          {/* Analysis Panel */}
          <AnalysisPanel post={post} onAnalyze={handleAnalysisComplete} />

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p>
                  <span className="font-medium text-gray-800">Post ID:</span>{" "}
                  {post.id}
                </p>
                <p>
                  <span className="font-medium text-gray-800">User ID:</span>{" "}
                  {post.userId}
                </p>
              </div>
              <div className="space-y-1">
                <p>
                  <span className="font-medium text-gray-800">Created:</span>{" "}
                  {new Date(post.createdAt).toLocaleString()}
                </p>
                <p>
                  <span className="font-medium text-gray-800">Updated:</span>{" "}
                  {new Date(post.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
            {post.isLocal && (
              <p className="text-blue-600 mt-3 text-sm font-medium">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                This is a locally created post
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
