import { prisma } from "./prisma.js";
import { postsAPI, usersAPI } from "./api.js";

// Posts Database Operations
export const postsDB = {
  // Get all posts with pagination
  async getAllPosts(page = 1, limit = 10, includeAnalysis = false) {
    try {
      const skip = (page - 1) * limit;

      const [posts, totalCount] = await Promise.all([
        prisma.post.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            analysis: includeAnalysis,
            user: {
              select: { id: true, name: true, username: true, email: true },
            },
          },
        }),
        prisma.post.count(),
      ]);

      return {
        posts,
        totalPosts: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: skip + limit < totalCount,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      console.error("Error fetching posts from database:", error);
      throw new Error("Failed to fetch posts from database");
    }
  },

  // Get single post by ID
  async getPostById(id, includeAnalysis = true) {
    try {
      const post = await prisma.post.findUnique({
        where: { id: parseInt(id) },
        include: {
          analysis: includeAnalysis
            ? {
                orderBy: { createdAt: "desc" },
                take: 1, // Get latest analysis
              }
            : false,
          user: {
            select: { id: true, name: true, username: true, email: true },
          },
        },
      });

      if (!post) {
        throw new Error("Post not found");
      }

      return post;
    } catch (error) {
      console.error("Error fetching post from database:", error);
      throw error;
    }
  },

  // Create new post
  async createPost(postData) {
    try {
      const post = await prisma.post.create({
        data: {
          title: postData.title,
          body: postData.body,
          userId: postData.userId,
          isLocal: true, // Mark as locally created
        },
        include: {
          user: {
            select: { id: true, name: true, username: true, email: true },
          },
        },
      });

      return post;
    } catch (error) {
      console.error("Error creating post in database:", error);
      throw new Error("Failed to create post in database");
    }
  },

  // Update post
  async updatePost(id, updateData) {
    try {
      const post = await prisma.post.update({
        where: { id: parseInt(id) },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: { id: true, name: true, username: true, email: true },
          },
        },
      });

      return post;
    } catch (error) {
      console.error("Error updating post in database:", error);
      throw new Error("Failed to update post in database");
    }
  },

  // Delete post
  async deletePost(id) {
    try {
      await prisma.post.delete({
        where: { id: parseInt(id) },
      });

      return { success: true };
    } catch (error) {
      console.error("Error deleting post from database:", error);
      throw new Error("Failed to delete post from database");
    }
  },

  // Sync posts from JSONPlaceholder
  async syncPostsFromExternal() {
    try {
      console.log("Starting posts sync from JSONPlaceholder...");

      // Get all posts from JSONPlaceholder
      const response = await postsAPI.getAllPosts(1, 100); // Get all posts
      const externalPosts = response.posts;

      let syncedCount = 0;
      let errorCount = 0;

      for (const externalPost of externalPosts) {
        try {
          // Check if post already exists
          const existingPost = await prisma.post.findUnique({
            where: { externalId: externalPost.id },
          });

          if (!existingPost) {
            // Ensure user exists first
            await usersDB.syncUserById(externalPost.userId);

            // Create new post
            await prisma.post.create({
              data: {
                externalId: externalPost.id,
                title: externalPost.title,
                body: externalPost.body,
                userId: externalPost.userId,
                isLocal: false,
              },
            });

            syncedCount++;
          }
        } catch (postError) {
          console.error(`Error syncing post ${externalPost.id}:`, postError);
          errorCount++;
        }
      }

      // Log sync results
      await prisma.syncLog.create({
        data: {
          action: "SYNC_POSTS",
          status: errorCount === 0 ? "SUCCESS" : "PARTIAL",
          recordCount: syncedCount,
          errorMessage:
            errorCount > 0 ? `${errorCount} posts failed to sync` : null,
        },
      });

      console.log(
        `Posts sync completed: ${syncedCount} synced, ${errorCount} errors`
      );
      return { syncedCount, errorCount };
    } catch (error) {
      console.error("Error syncing posts:", error);

      await prisma.syncLog.create({
        data: {
          action: "SYNC_POSTS",
          status: "FAILED",
          errorMessage: error.message,
        },
      });

      throw error;
    }
  },
};

// Users Database Operations
export const usersDB = {
  // Get user by ID
  async getUserById(id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: {
          posts: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      return user;
    } catch (error) {
      console.error("Error fetching user from database:", error);
      throw new Error("Failed to fetch user from database");
    }
  },

  // Sync single user from JSONPlaceholder
  async syncUserById(userId) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
      });

      if (existingUser) {
        return existingUser;
      }

      // Fetch user from JSONPlaceholder
      const externalUser = await usersAPI.getUserById(userId);

      // Create user in database
      const user = await prisma.user.create({
        data: {
          id: externalUser.id,
          name: externalUser.name,
          username: externalUser.username,
          email: externalUser.email,
          phone: externalUser.phone,
          website: externalUser.website,
        },
      });

      return user;
    } catch (error) {
      console.error(`Error syncing user ${userId}:`, error);
      // Create a placeholder user if external fetch fails
      const placeholderUser = await prisma.user.upsert({
        where: { id: parseInt(userId) },
        update: {},
        create: {
          id: parseInt(userId),
          name: `User ${userId}`,
          username: `user${userId}`,
          email: `user${userId}@example.com`,
        },
      });

      return placeholderUser;
    }
  },
};

// Analysis Database Operations
export const analysisDB = {
  // Create analysis for a post
  async createAnalysis(postId, analysisData) {
    try {
      const analysis = await prisma.postAnalysis.create({
        data: {
          postId: parseInt(postId),
          ...analysisData,
        },
      });

      return analysis;
    } catch (error) {
      console.error("Error creating analysis in database:", error);
      throw new Error("Failed to create analysis in database");
    }
  },

  // Get latest analysis for a post
  async getLatestAnalysis(postId) {
    try {
      const analysis = await prisma.postAnalysis.findFirst({
        where: { postId: parseInt(postId) },
        orderBy: { createdAt: "desc" },
      });

      return analysis;
    } catch (error) {
      console.error("Error fetching analysis from database:", error);
      throw new Error("Failed to fetch analysis from database");
    }
  },
};

// API Keys Database Operations
export const apiKeysDB = {
  // Validate API key
  async validateApiKey(key) {
    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { key },
        select: {
          id: true,
          name: true,
          isActive: true,
          permissions: true,
        },
      });

      if (!apiKey || !apiKey.isActive) {
        return null;
      }

      // Update last used timestamp
      await prisma.apiKey.update({
        where: { key },
        data: { lastUsed: new Date() },
      });

      return apiKey;
    } catch (error) {
      console.error("Error validating API key:", error);
      return null;
    }
  },

  // Create API key
  async createApiKey(name, permissions = []) {
    try {
      const key = generateApiKey();

      const apiKey = await prisma.apiKey.create({
        data: {
          name,
          key,
          permissions,
        },
      });

      return { ...apiKey, key }; // Return unhashed key only once
    } catch (error) {
      console.error("Error creating API key:", error);
      throw new Error("Failed to create API key");
    }
  },
};

// Helper function to generate API keys
function generateApiKey() {
  return (
    "pk_" +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
