import { Router } from "express";
import { authenticate } from "../../middleware/auths.middleware";
import { PaymentProofsController } from "./paymentProofs.controller";

export const PaymentProofsRoute = Router();

// customer & EO sama-sama boleh, hak akses ke transaksinya dicek di service
PaymentProofsRoute.get("/transactions/:transactionId", authenticate, PaymentProofsController.getPaymentProofsByTransaction);
