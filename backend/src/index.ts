import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import routes from "./routes/router.js";
import clientQdrant from "./services/vectorDb/qdrantClient.js";

dotenv.config();

async function main() {
  const app = express(); 
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(cookieParser());
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(express.json());
  
  // Health check route
  app.get("/", (req, res) => {
    res.send("Server is running!");
  });

  // API routes
  app.use("/api",routes);

  // Start server
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });

  // Test Qdrant connection
  try {
    const result = await clientQdrant.getCollections();
    console.log("Collections:", result.collections);
  } catch (err) {
    console.error("Qdrant connection error:", err);
  }
}

main();