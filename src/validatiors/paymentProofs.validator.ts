import * as z from "zod";

const transactionId = z.string().min(1, "Transaction ID is required");

// create bukti bayar lewat PATCH /transactions/:id/payment-proof,
// accept / reject lewat PATCH /transactions/:id/confirm
export const paymentProofsGetByTransactionSchema = z.object({
  params: z.object({
    transactionId,
  }),
});

export type PaymentProofsGetByTransactionSchema = z.infer<typeof paymentProofsGetByTransactionSchema>;
