import "dotenv/config";
import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors.config";
import { errorMiddleware } from "./middleware/error.middleware";
// glen
import authRoute from "./features/auth/auth.route";
import { AuthsRoute } from "./features/auths/auths.route";
import cookieParser from 'cookie-parser';

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

app.use(cookieParser());

// Authentication routes
app.use(`${API_PREFIX}/auth`, AuthsRoute);


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
