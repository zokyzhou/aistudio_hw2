const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

async function main() {
  if (!process.env.MONGODB_URI) {
    console.log("MONGODB_URI missing");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || "carbon_market" });
    console.log("✅ connected");
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error("❌ connection error:", e.message);
    process.exit(1);
  }
}

main();
