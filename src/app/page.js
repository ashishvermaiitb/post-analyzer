"use client";

import { useState } from "react";
import PostTable from "../components/PostTable";
import CreatePostModal from "../components/CreatePostModal";
import Pagination from "../components/Pagination";
import { usePosts } from "../hooks/usePosts";

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const {
    posts,
    loading,
    error,
    pagination,
    createPost,
    nextPage,
    previousPage,
    goToPage,
    refreshPosts,
  } = usePosts(1, 10); // Starting with page 1, 10 posts per page

  const handlePostCreated = async (newPostData) => {
    try {
      await createPost(newPostData);
      setShowModal(false);
    } catch (error) {
      console.error("Failed to create post:", error);
      // Modal will remain open, user can retry
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            onClick={refreshPosts}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Posts Dashboard</h1>
        <button
          onClick={refreshPosts}
          className="text-gray-600 hover:text-gray-800"
          title="Refresh posts"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Create New Post
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <PostTable posts={posts} loading={loading} />

        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalPosts={pagination.totalPosts}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          onNextPage={nextPage}
          onPreviousPage={previousPage}
          onGoToPage={goToPage}
        />
      </div>

      {showModal && (
        <CreatePostModal
          onClose={() => setShowModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
}
