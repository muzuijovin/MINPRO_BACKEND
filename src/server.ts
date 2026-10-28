import "dotenv/config";
import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors.config";
import { errorMiddleware } from "./middleware/error.middleware";
// glen
import { AuthsRoute } from "./features/auths/auths.route";
import cookieParser from 'cookie-parser';

//
// jovin
import { EventsRoute } from "./features/events/events.route";
import { CategoriesRoute } from "./features/categories/categories.route";
import { VoucherRoute } from "./features/eventVoucher/voucher.route";
import { BankAccountsRoute } from "./features/bankAccounts/bankAccounts.route";
import { TransactionsRoute } from "./features/transactions/transactions.route";
import { PaymentProofsRoute } from "./features/paymentProofs/paymentProofs.route";
import { OrganizerStatisticsRoute } from "./features/organizerStatistics/organizerStatistics.route";
import { ReviewsRoute } from "./features/reviews/reviews.route";
import { startTransactionsJob } from "./jobs/transactions.job";

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
app.use(`${API_PREFIX}/events`, EventsRoute);
app.use(`${API_PREFIX}/categories`, CategoriesRoute)
app.use(`${API_PREFIX}/vouchers`, VoucherRoute)
app.use(`${API_PREFIX}/transactions`, TransactionsRoute)
app.use(`${API_PREFIX}/bank-accounts`, BankAccountsRoute)
app.use(`${API_PREFIX}/payment-proofs`, PaymentProofsRoute)
app.use(`${API_PREFIX}/organizer/statistics`, OrganizerStatisticsRoute)
app.use(`${API_PREFIX}/reviews`, ReviewsRoute)


//
//menangani error middleware (wajib dipasang SETELAH semua route, kalau sebelum route error tidak akan ketangkep)
app.use(errorMiddleware);

// Start server only in development
if (process.env.NODE_ENV === "development") {
  app.listen(PORT, () => {
    console.log(`Application Running On Port ${PORT}`);
  });

  // auto-expire & auto-cancel transaksi tiap menit (production pakai POST /transactions/jobs/expire)
  startTransactionsJob();
}

export default app;
