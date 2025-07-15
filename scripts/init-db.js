import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load environment variables first
config();

console.log("🚀 Starting database initialization...");

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
});

// Simple posts API for syncing
async function fetchPostsFromAPI() {
  try {
    console.log("📡 Fetching posts from JSONPlaceholder...");
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const posts = await response.json();
    console.log(`✅ Fetched ${posts.length} posts from API`);
    return posts;
  } catch (error) {
    console.error("❌ Error fetching posts:", error.message);
    throw error;
  }
}

// Simple users API for syncing
async function fetchUsersFromAPI() {
  try {
    console.log("📡 Fetching users from JSONPlaceholder...");
    const response = await fetch("https://jsonplaceholder.typicode.com/users");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const users = await response.json();
    console.log(`✅ Fetched ${users.length} users from API`);
    return users;
  } catch (error) {
    console.error("❌ Error fetching users:", error.message);
    throw error;
  }
}

// Generate API key
function generateApiKey() {
  return (
    "pk_" +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

async function initializeDatabase() {
  try {
    console.log("🔍 Testing database connection...");

    // Test database connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database connection successful");

    // Check if data already exists
    const existingPosts = await prisma.post.count();
    const existingUsers = await prisma.user.count();
    const existingApiKeys = await prisma.apiKey.count();

    console.log(`📊 Current database state:`);
    console.log(`   Users: ${existingUsers}`);
    console.log(`   Posts: ${existingPosts}`);
    console.log(`   API Keys: ${existingApiKeys}`);

    // Create default API key if none exist
    if (existingApiKeys === 0) {
      console.log("🔑 Creating default API key...");
      const apiKey = generateApiKey();

      await prisma.apiKey.create({
        data: {
          name: "Default Development Key",
          key: apiKey,
          permissions: [
            "CREATE_POST",
            "UPDATE_POST",
            "DELETE_POST",
            "ANALYZE_POST",
          ],
        },
      });

      console.log(`✅ Default API key created: ${apiKey}`);
      console.log("⚠️  Save this key - add it to your .env.local file!");
      console.log(`   NEXT_PUBLIC_API_KEY="${apiKey}"`);
    } else {
      console.log("ℹ️  API keys already exist, skipping creation");
    }

    // Sync users first
    if (existingUsers === 0) {
      console.log("👥 Syncing users from JSONPlaceholder...");
      const users = await fetchUsersFromAPI();

      let usersSynced = 0;
      for (const user of users) {
        try {
          await prisma.user.create({
            data: {
              id: user.id,
              name: user.name,
              username: user.username,
              email: user.email,
              phone: user.phone,
              website: user.website,
            },
          });
          usersSynced++;
        } catch (error) {
          console.error(`❌ Failed to sync user ${user.id}:`, error.message);
        }
      }
      console.log(`✅ Synced ${usersSynced} users`);
    } else {
      console.log("ℹ️  Users already exist, skipping sync");
    }

    // Sync posts
    if (existingPosts === 0) {
      console.log("📝 Syncing posts from JSONPlaceholder...");
      const posts = await fetchPostsFromAPI();

      let postsSynced = 0;
      for (const post of posts) {
        try {
          await prisma.post.create({
            data: {
              externalId: post.id,
              title: post.title,
              body: post.body,
              userId: post.userId,
              isLocal: false,
            },
          });
          postsSynced++;
        } catch (error) {
          console.error(`❌ Failed to sync post ${post.id}:`, error.message);
        }
      }
      console.log(`✅ Synced ${postsSynced} posts`);
    } else {
      console.log("ℹ️  Posts already exist, skipping sync");
    }

    // Log sync results
    await prisma.syncLog.create({
      data: {
        action: "INIT_DATABASE",
        status: "SUCCESS",
        recordCount: existingPosts === 0 ? 100 : 0,
        errorMessage: null,
      },
    });

    // Final summary
    const finalPostCount = await prisma.post.count();
    const finalUserCount = await prisma.user.count();
    const finalApiKeyCount = await prisma.apiKey.count();

    console.log("\n🎉 Database initialization completed successfully!");
    console.log("\n📊 Final Database Summary:");
    console.log(`   Users: ${finalUserCount}`);
    console.log(`   Posts: ${finalPostCount}`);
    console.log(`   API Keys: ${finalApiKeyCount}`);
    console.log("\n📝 Next steps:");
    console.log("   1. Make sure to add the API key to your .env.local file");
    console.log("   2. Run: npm run dev");
    console.log("   3. Visit: http://localhost:3000");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    console.error("Stack trace:", error.stack);

    try {
      await prisma.syncLog.create({
        data: {
          action: "INIT_DATABASE",
          status: "FAILED",
          errorMessage: error.message,
        },
      });
    } catch (logError) {
      console.error("❌ Failed to log error:", logError.message);
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Database connection closed");
  }
}

// Add error handling for unhandled rejections
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled rejection:", error);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error);
  process.exit(1);
});

// Run the initialization
console.log("🏁 Starting initialization process...");
initializeDatabase();
