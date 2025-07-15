import { useState, useEffect, useCallback } from "react";
import { postsAPI } from "../lib/api";

export function usePosts(initialPage = 1, postsPerPage = 10) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    totalPages: 0,
    totalPosts: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Fetch posts with pagination
  const fetchPosts = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const response = await postsAPI.getAllPosts(page, postsPerPage);

        setPosts(response.posts);
        setPagination({
          currentPage: response.currentPage,
          totalPages: response.totalPages,
          totalPosts: response.totalPosts,
          hasNextPage: response.hasNextPage,
          hasPreviousPage: response.hasPreviousPage,
        });
      } catch (err) {
        setError(err.message);
        console.error("Error in usePosts:", err);
      } finally {
        setLoading(false);
      }
    },
    [postsPerPage]
  );

  // Creating post with optimistic update
  const createPost = useCallback(
    async (postData) => {
      try {
        const newPost = await postsAPI.createPost(postData);

        // Adding to the beginning of the posts array (optimistic update)
        setPosts((prevPosts) => [newPost, ...prevPosts]);

        // Updating pagination
        setPagination((prev) => ({
          ...prev,
          totalPosts: prev.totalPosts + 1,
          totalPages: Math.ceil((prev.totalPosts + 1) / postsPerPage),
        }));

        return newPost;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [postsPerPage]
  );

  // Updating post with optimistic update
  const updatePost = useCallback(async (id, updateData) => {
    try {
      const updatedPost = await postsAPI.updatePost(id, updateData);

      // Update in the posts array
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === id ? { ...post, ...updatedPost } : post
        )
      );

      return updatedPost;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Delete post with optimistic update
  const deletePost = useCallback(
    async (id) => {
      try {
        await postsAPI.deletePost(id);

        // Remove from posts array
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== id));

        // Update pagination
        setPagination((prev) => ({
          ...prev,
          totalPosts: prev.totalPosts - 1,
          totalPages: Math.ceil((prev.totalPosts - 1) / postsPerPage),
        }));
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [postsPerPage]
  );

  // Navigate to next page
  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      fetchPosts(pagination.currentPage + 1);
    }
  }, [fetchPosts, pagination.hasNextPage, pagination.currentPage]);

  // Navigate to previous page
  const previousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      fetchPosts(pagination.currentPage - 1);
    }
  }, [fetchPosts, pagination.hasPreviousPage, pagination.currentPage]);

  // Go to specific page
  const goToPage = useCallback(
    (page) => {
      if (page >= 1 && page <= pagination.totalPages) {
        fetchPosts(page);
      }
    },
    [fetchPosts, pagination.totalPages]
  );

  // Refresh posts
  const refreshPosts = useCallback(() => {
    fetchPosts(pagination.currentPage);
  }, [fetchPosts, pagination.currentPage]);

  // Initial fetch
  useEffect(() => {
    fetchPosts(initialPage);
  }, [fetchPosts, initialPage]);

  return {
    posts,
    loading,
    error,
    pagination,
    createPost,
    updatePost,
    deletePost,
    nextPage,
    previousPage,
    goToPage,
    refreshPosts,
    fetchPosts,
  };
}

export function usePost(postId) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPost = useCallback(async () => {
    if (!postId) return;

    try {
      setLoading(true);
      setError(null);

      const postData = await postsAPI.getPostById(postId);
      setPost(postData);
    } catch (err) {
      setError(err.message);
      console.error("Error in usePost:", err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const updatePost = useCallback(
    async (updateData) => {
      try {
        const updatedPost = await postsAPI.updatePost(postId, updateData);
        setPost((prev) => ({ ...prev, ...updatedPost }));
        return updatedPost;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [postId]
  );

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return {
    post,
    loading,
    error,
    updatePost,
    refreshPost: fetchPost,
  };
}
