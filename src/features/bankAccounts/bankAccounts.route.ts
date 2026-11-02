import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auths.middleware";
import { BankAccountsController } from "./bankAccounts.controller";

export const BankAccountsRoute = Router();

// kelola rekening hanya untuk EO, kepemilikan rekening dicek di service
BankAccountsRoute.post("/", authenticate, authorize(["EO"]), BankAccountsController.createBankAccount);
BankAccountsRoute.get("/me", authenticate, authorize(["EO"]), BankAccountsController.getMyBankAccounts);
BankAccountsRoute.patch("/:id", authenticate, authorize(["EO"]), BankAccountsController.updateBankAccount);

// dipakai customer di halaman checkout untuk pilih rekening tujuan transfer
BankAccountsRoute.get("/events/:eventId", authenticate, BankAccountsController.getBankAccountsByEvent);
