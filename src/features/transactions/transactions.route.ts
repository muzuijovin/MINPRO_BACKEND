import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auths.middleware";
import { uploadMiddleware } from "../../middleware/upload.middleware";
import { TransactionsController } from "./transactions.controller";

export const TransactionsRoute = Router();

// checkout tiket hanya untuk customer
TransactionsRoute.post("/", authenticate, authorize(["CUSTOMER"]), TransactionsController.checkout);

// history transaksi untuk dashboard customer
TransactionsRoute.get("/", authenticate, authorize(["CUSTOMER"]), TransactionsController.getMyTransactions);

// transaksi dari event milik EO, harus di atas '/:id' biar "organizer" tidak kebaca sebagai id
TransactionsRoute.get("/organizer", authenticate, authorize(["EO"]), TransactionsController.getOrganizerTransactions);

// detail transaksi, boleh customer pemilik transaksi & EO pemilik event (dicek di service)
TransactionsRoute.get("/:id", authenticate, TransactionsController.getTransactionDetail);

// scheduler production (cron-job.org), tidak pakai token login tapi header x-cron-secret
TransactionsRoute.post("/jobs/expire", TransactionsController.expireOverdueTransactions);

// customer upload bukti transfer -> WAITING_FOR_CONFIRMATION
TransactionsRoute.patch(
  "/:id/payment-proof",
  authenticate,
  authorize(["CUSTOMER"]),
  uploadMiddleware(["jpg", "jpeg", "png", "webp"], "MEMORY").fields([
    { name: "paymentProof", maxCount: 1 },
  ]),
  TransactionsController.uploadPaymentProof,
);

// EO accept (PAID) / reject (REJECTED) bukti transfer, kepemilikan event dicek di service
TransactionsRoute.patch("/:id/confirm", authenticate, authorize(["EO"]), TransactionsController.confirmPayment);
