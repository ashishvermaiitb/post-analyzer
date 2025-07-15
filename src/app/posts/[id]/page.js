"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function PostDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data for testing
      const mockPost = {
        id: parseInt(id),
        title: `Post ${id} Title`,
        body: `This is the content of post ${id}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
        userId: 1,
      };

      setPost(mockPost);
      setTitle(mockPost.title);
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePost = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update local state
      setPost({ ...post, title });
      setEditing(false);
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post");
    }
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
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Dashboard
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="mt-4 flex space-x-3">
              <button
                onClick={updatePost}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setTitle(post.title);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {post.title}
            </h1>
            <button
              onClick={() => setEditing(true)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit Title
            </button>
          </div>
        )}

        <div className="mb-6">
          <p className="text-gray-600 leading-relaxed">{post.body}</p>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Post Analysis
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">
              Analysis results will appear here once C++ backend is integrated.
            </p>
            <div className="mt-2 text-sm text-gray-500">
              <p>• Word count: Coming soon</p>
              <p>• Sentiment score: Coming soon</p>
              <p>• Keywords: Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
