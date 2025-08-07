import dotenv from "dotenv";
import app from "./app.js";
import Prisma from "./db/db.js";

// Load environment variables early
dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 9000;

(async function main() {
  try {
    // Connect to database
    await Prisma.$connect();
    console.log("✅ DATABASE CONNECTED SUCCESSFULLY");

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 SERVER RUNNING: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ SERVER FAILED TO START:", err);
    process.exit(1); // Exit with failure
  }

  // Optional: Handle unhandled errors globally
  process.on("unhandledRejection", (reason, promise) => {
    console.error("⚠️ Unhandled Rejection:", reason);
  });

  process.on("uncaughtException", (err) => {
    console.error("💥 Uncaught Exception:", err);
    process.exit(1);
  });
})();