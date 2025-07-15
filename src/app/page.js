"use client";

import { useState } from "react";
import PostTable from "../components/PostTable";
import CreatePostModal from "../components/CreatePostModal";

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "Sample Post Title",
      body: "This is a sample post content that demonstrates how the table will look with actual data. It shows the layout and styling.",
      userId: 1,
    },
    {
      id: 2,
      title: "Another Post Title",
      body: "Another sample post content to show multiple rows in the table. This helps visualize the final design.",
      userId: 1,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    setShowModal(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Posts Dashboard</h1>

      <div className="mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
        >
          Create New Post
        </button>
      </div>

      <PostTable posts={posts} loading={loading} />

      {showModal && (
        <CreatePostModal
          onClose={() => setShowModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
}
