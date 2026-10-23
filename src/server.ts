import "dotenv/config";
import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors.config";
import { errorMiddleware } from "./middleware/error.middleware";
// glen
import authRoute from "./features/auth/auth.route";

//
// jovin
import { EventsRoute } from "./features/events/events.route";
import { CategoriesRoute } from "./features/categories/categories.route";

//

const PORT: number = parseInt(process.env.PORT!);
const API_PREFIX: string = process.env.API_PREFIX!;
const app = express();

// CORS configuration
app.use(cors(corsOptions));

// Parse JSON request body
app.use(express.json());
// glen
// Authentication routes
app.use(`${API_PREFIX}/auth`, authRoute);

//
// jovin
// Error handling middleware
app.use(`${API_PREFIX}/events`, EventsRoute);
app.use(`${API_PREFIX}/categories`, CategoriesRoute)


//
//menangani error middleware (wajib dipasang SETELAH semua route, kalau sebelum route error tidak akan ketangkep)
app.use(errorMiddleware);

// Start server only in development
if (process.env.NODE_ENV === "development") {
  app.listen(PORT, () => {
    console.log(`Application Running On Port ${PORT}`);
  });
}

export default app;
