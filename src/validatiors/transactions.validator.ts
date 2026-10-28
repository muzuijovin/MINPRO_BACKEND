import * as z from "zod";
import { PaymentProofDecision, TransactionStatus } from "../generated/prisma/enums";

const id = z.string().min(1, "ID is required");

const eventId = z.string().min(1, "Event ID is required");

const bankAccountId = z.string().min(1, "Bank account ID is required");

const quantity = z
  .number({ message: "Quantity must be a valid number" })
  .int("Quantity must be an integer")
  .min(1, "Quantity must be at least 1");

// voucher & coupon sifatnya opsional, kalau FE kirim null dianggap tidak pakai
const eventVoucherId = z.string().min(1, "Invalid event voucher ID").nullable().optional();

const userCouponId = z.string().min(1, "Invalid coupon ID").nullable().optional();

const pointUsed = z
  .number({ message: "Points must be a valid number" })
  .int("Points must be an integer")
  .min(0, "Points cannot be negative");

const status = z.enum(TransactionStatus);

const decision = z.enum(PaymentProofDecision);

export const transactionsCreateSchema = z.object({
  // customerId diisi controller dari token (jangan dari req.body FE), sedangkan ticketPrice, subtotal, diskon, finalAmount,
  // transactionCode & paymentDeadline dihitung di service (tidak boleh dikirim FE biar tidak dimanipulasi)
  // cek saldo poin, validitas voucher/coupon & sisa kuota event juga di service karena butuh data DB
  body: z.object({
    eventId,
    bankAccountId,
    quantity,
    eventVoucherId,
    userCouponId,
    pointUsed: pointUsed.optional().default(0),
  }),
});

export const transactionsGetSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1), //coerce ini ngubah string di query menjadi number
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    // kode transaksi atau judul event
    search: z.string().trim().optional(),
    status: status.optional(),
    eventId: z.string().trim().optional(),
    sortBy: z.enum(["createdAt", "finalAmount"]).optional().default("createdAt"),
    order: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const transactionsGetDetailSchema = z.object({
  params: z.object({
    id,
  }),
});

// upload bukti bayar, file nya divalidasi lewat multer (req.file), di sini cukup id transaksi
export const transactionsUploadProofSchema = z.object({
  params: z.object({
    id,
  }),
});

// EO accept / reject bukti pembayaran
export const transactionsConfirmSchema = z.object({
  params: z.object({
    id,
  }),
  body: z.object({
    decision: decision.exclude(["PENDING"], {
      message: "Decision must be ACCEPTED or REJECTED",
    }),
  }),
});

export const transactionsCancelSchema = z.object({
  params: z.object({
    id,
  }),
});

export type TransactionsCreateSchema = z.infer<typeof transactionsCreateSchema>;

export type TransactionsGetSchema = z.infer<typeof transactionsGetSchema>;

export type TransactionsGetDetailSchema = z.infer<typeof transactionsGetDetailSchema>;

export type TransactionsUploadProofSchema = z.infer<typeof transactionsUploadProofSchema>;

export type TransactionsConfirmSchema = z.infer<typeof transactionsConfirmSchema>;

export type TransactionsCancelSchema = z.infer<typeof transactionsCancelSchema>;
