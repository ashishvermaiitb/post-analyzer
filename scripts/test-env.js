import { config } from "dotenv";
import path from "path";

// Load environment variables
config({ path: path.resolve(process.cwd(), ".env.local") });

console.log("🔍 Checking environment variables...\n");

const requiredVars = ["DATABASE_URL", "API_KEY_SECRET", "JWT_SECRET"];

let allPresent = true;

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: Not found`);
    allPresent = false;
  }
});

if (allPresent) {
  console.log("\n🎉 All required environment variables are present!");
} else {
  console.log(
    "\n❌ Some environment variables are missing. Please check your .env.local file."
  );
  process.exit(1);
}

// Test database URL format
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  try {
    const url = new URL(dbUrl);
    console.log(`\n📊 Database Info:`);
    console.log(`   Protocol: ${url.protocol}`);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port || "default"}`);
    console.log(`   Database: ${url.pathname.slice(1)}`);
    console.log(`   User: ${url.username}`);
  } catch (error) {
    console.log("\n❌ Invalid DATABASE_URL format");
    process.exit(1);
  }
}
