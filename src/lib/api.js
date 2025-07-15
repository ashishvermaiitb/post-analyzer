import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const EXTERNAL_API_BASE_URL = "https://jsonplaceholder.typicode.com";

// Create axios instance for our database API
const dbApi = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Create axios instance for external API (JSONPlaceholder)
const externalApi = axios.create({
  baseURL: EXTERNAL_API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for database API (add API key for protected routes)
dbApi.interceptors.request.use(
  (config) => {
    // Add API key for POST, PUT, DELETE requests
    if (["post", "put", "delete"].includes(config.method)) {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      if (apiKey) {
        config.headers["x-api-key"] = apiKey;
      }
    }

    console.log(
      `DB API Request: ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("DB API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
dbApi.interceptors.response.use(
  (response) => {
    console.log(`DB API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(
      "DB API Response Error:",
      error.response?.status,
      error.message
    );
    return Promise.reject(error);
  }
);

// Posts API functions - now using our database
export const postsAPI = {
  // Get all posts with pagination
  async getAllPosts(page = 1, limit = 10, includeAnalysis = false) {
    try {
      const response = await dbApi.get("/posts", {
        params: { page, limit, includeAnalysis },
      });

      // Extract data from the success response structure
      const responseData = response.data.data;

      // Transform to match expected format
      return {
        posts: responseData.posts,
        totalPosts: responseData.pagination.totalPosts,
        currentPage: responseData.pagination.currentPage,
        totalPages: responseData.pagination.totalPages,
        hasNextPage: responseData.pagination.hasNextPage,
        hasPreviousPage: responseData.pagination.hasPreviousPage,
      };
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw new Error(error.response?.data?.error || "Failed to fetch posts");
    }
  },

  // Get single post by ID
  async getPostById(id, includeAnalysis = true) {
    try {
      const response = await dbApi.get(`/posts/${id}`, {
        params: { includeAnalysis },
      });

      return response.data.data;
    } catch (error) {
      console.error("Error fetching post:", error);
      if (error.response?.status === 404) {
        throw new Error("Post not found");
      }
      throw new Error(error.response?.data?.error || "Failed to fetch post");
    }
  },

  // Create new post
  async createPost(postData) {
    try {
      const response = await dbApi.post("/posts", {
        title: postData.title,
        body: postData.body,
        userId: postData.userId || 1,
      });

      return response.data.data;
    } catch (error) {
      console.error("Error creating post:", error);
      throw new Error(error.response?.data?.error || "Failed to create post");
    }
  },

  // Update post
  async updatePost(id, updateData) {
    try {
      const response = await dbApi.put(`/posts/${id}`, updateData);
      return response.data.data;
    } catch (error) {
      console.error("Error updating post:", error);
      throw new Error(error.response?.data?.error || "Failed to update post");
    }
  },

  // Delete post
  async deletePost(id) {
    try {
      const response = await dbApi.delete(`/posts/${id}`);
      return response.data.data;
    } catch (error) {
      console.error("Error deleting post:", error);
      throw new Error(error.response?.data?.error || "Failed to delete post");
    }
  },
};

// External API functions (for syncing from JSONPlaceholder)
export const externalAPI = {
  async getAllPosts() {
    try {
      const response = await externalApi.get("/posts");
      return response.data;
    } catch (error) {
      console.error("Error fetching posts from external API:", error);
      throw new Error("Failed to fetch posts from external API");
    }
  },

  async getPostById(id) {
    try {
      const response = await externalApi.get(`/posts/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching post from external API:", error);
      throw new Error("Failed to fetch post from external API");
    }
  },

  async getUserById(id) {
    try {
      const response = await externalApi.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user from external API:", error);
      throw new Error("Failed to fetch user from external API");
    }
  },
};

// Keep old exports for backward compatibility
export const usersAPI = {
  async getUserById(id) {
    return externalAPI.getUserById(id);
  },
};

export const commentsAPI = {
  async getCommentsByPostId(postId) {
    try {
      const response = await externalApi.get(`/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      console.error("Error fetching comments:", error);
      throw new Error("Failed to fetch comments");
    }
  },
};

export default dbApi;
