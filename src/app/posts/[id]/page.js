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
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Post not found
          </h1>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <button
          onClick={() => router.push("/")}
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
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
              className="block text-sm font-medium text-gray-700 mb-2"
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
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setTitle(post.title);
                }}
                disabled={saving}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-3xl font-bold text-gray-800">{post.title}</h1>
              <button
                onClick={() => setEditing(true)}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Edit Title
              </button>
            </div>
            {post.user && (
              <p className="text-sm text-gray-500">
                By {post.user.name} (@{post.user.username})
              </p>
            )}
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Content</h3>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.body}
            </p>
          </div>
        </div>

        {/* Analysis Panel */}
        <AnalysisPanel post={post} onAnalyze={handleAnalysisComplete} />

        <div className="mt-6 pt-6 border-t">
          <div className="text-sm text-gray-500 grid grid-cols-2 gap-4">
            <div>
              <p>
                <strong>Post ID:</strong> {post.id}
              </p>
              <p>
                <strong>User ID:</strong> {post.userId}
              </p>
            </div>
            <div>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(post.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Updated:</strong>{" "}
                {new Date(post.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
          {post.isLocal && (
            <p className="text-blue-600 mt-2 text-sm">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
              This is a locally created post
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
