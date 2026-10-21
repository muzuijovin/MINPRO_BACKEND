import "dotenv/config";
import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors.config";
import { errorMiddleware } from "./middleware/error.middleware";
import authRoute from "./features/auth/auth.route";

const PORT: number = parseInt(process.env.PORT!);
const API_PREFIX: string = process.env.API_PREFIX!;
const app = express();

// CORS configuration
app.use(cors(corsOptions));

// Parse JSON request body
app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoute);

// Error handling middleware
app.use(errorMiddleware);

// Start server only in development
if (process.env.NODE_ENV === "development") {
  app.listen(PORT, () => {
    console.log(`Application Running On Port ${PORT}`);
  });
}

export default app;
