import axios from "axios";

const API_BASE_URL = "https://jsonplaceholder.typicode.com";

// axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Added request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Added response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("API Response Error:", error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// Posts API functions
export const postsAPI = {
  // Getting all posts with pagination support
  async getAllPosts(page = 1, limit = 10) {
    try {
      const response = await api.get("/posts");
      const posts = response.data;

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPosts = posts.slice(startIndex, endIndex);

      return {
        posts: paginatedPosts,
        totalPosts: posts.length,
        currentPage: page,
        totalPages: Math.ceil(posts.length / limit),
        hasNextPage: endIndex < posts.length,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw new Error("Failed to fetch posts");
    }
  },

  // Getting single post by ID
  async getPostById(id) {
    try {
      const response = await api.get(`/posts/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching post:", error);
      if (error.response?.status === 404) {
        throw new Error("Post not found");
      }
      throw new Error("Failed to fetch post");
    }
  },

  // Creatng new post
  async createPost(postData) {
    try {
      const response = await api.post("/posts", {
        title: postData.title,
        body: postData.body,
        userId: postData.userId || 1,
      });

      // JSONPlaceholder returns a post with id 101, but we'll use timestamp for uniqueness
      return {
        ...response.data,
        id: Date.now(), // Use timestamp for local uniqueness
        isLocal: true, // Flag to identify locally created posts
      };
    } catch (error) {
      console.error("Error creating post:", error);
      throw new Error("Failed to create post");
    }
  },

  // Update post
  async updatePost(id, updateData) {
    try {
      const response = await api.put(`/posts/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error("Error updating post:", error);
      throw new Error("Failed to update post");
    }
  },

  // Delete post
  async deletePost(id) {
    try {
      await api.delete(`/posts/${id}`);
      return { success: true };
    } catch (error) {
      console.error("Error deleting post:", error);
      throw new Error("Failed to delete post");
    }
  },
};

// Users API functions (for additional user info)
export const usersAPI = {
  async getUserById(id) {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw new Error("Failed to fetch user");
    }
  },
};

// Comments API functions (for future use)
export const commentsAPI = {
  async getCommentsByPostId(postId) {
    try {
      const response = await api.get(`/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      console.error("Error fetching comments:", error);
      throw new Error("Failed to fetch comments");
    }
  },
};

export default api;
