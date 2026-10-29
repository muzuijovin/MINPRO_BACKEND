
import "dotenv/config";
import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors.config";
import { errorMiddleware } from "./middleware/error.middleware";

// ==========================================
// GLENN - FEATURE 2 NOMOR 1
// Authentication & Access
// ==========================================
import { AuthsRoute } from "./features/auths/auths.route";

// ==========================================
// GLENN - FEATURE 2 NOMOR 2
// Customer & EO Profile
// ==========================================
import { ProfilesRoute } from "./features/profiles/profiles.route";

import cookieParser from "cookie-parser";

// ==========================================
// JOVIN - FEATURE 1
// Events, Categories & Event Vouchers
// ==========================================
import { EventsRoute } from "./features/events/events.route";
import { CategoriesRoute } from "./features/categories/categories.route";
import { VoucherRoute } from "./features/eventVoucher/voucher.route";

const PORT: number = parseInt(process.env.PORT!);
const API_PREFIX: string = process.env.API_PREFIX!;
const app = express();

// CORS configuration
app.use(cors(corsOptions));

// Parse JSON request body
app.use(express.json());

// Parse cookies for JWT authentication
app.use(cookieParser());

// ==========================================
// GLENN - FEATURE 2 NOMOR 1
// Authentication & Access Routes
// ==========================================
app.use(`${API_PREFIX}/auth`, AuthsRoute);

// ==========================================
// GLENN - FEATURE 2 NOMOR 2
// Customer & EO Profile Routes
// ==========================================
app.use(`${API_PREFIX}/profiles`, ProfilesRoute);

// ==========================================
// JOVIN - FEATURE 1
// Events, Categories & Event Voucher Routes
// ==========================================
app.use(`${API_PREFIX}/events`, EventsRoute);
app.use(`${API_PREFIX}/categories`, CategoriesRoute);
app.use(`${API_PREFIX}/vouchers`, VoucherRoute);

// ==========================================
// GLOBAL ERROR HANDLING
// Wajib dipasang setelah semua routes
// ==========================================
app.use(errorMiddleware);

// Start server only in development
if (process.env.NODE_ENV === "development") {
  app.listen(PORT, () => {
    console.log(`Application Running On Port ${PORT}`);
  });
}

export default app;
