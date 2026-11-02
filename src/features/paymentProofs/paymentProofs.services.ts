import { prisma } from "../../config/prisma-cllient.config";
import { AppError } from "../../errors/app.error";
import { PaymentProofsGetByTransactionSchema } from "../../validatiors/paymentProofs.validator";

export class PaymentProofsServices {
  // riwayat bukti bayar 1 transaksi, bisa dilihat customer pemilik transaksi & EO pemilik event
  static async getPaymentProofsByTransaction({ params }: PaymentProofsGetByTransactionSchema, userId: string) {
    const findTransactionById = await prisma.transactions.findFirst({
      where: {
        id: params.transactionId,
        deletedAt: null,
      },
      include: {
        events: {
          select: { organizer: { select: { userId: true } } },
        },
      },
    });

    if (!findTransactionById) throw new AppError(404, "Transaction not found");

    const isCustomer = findTransactionById.customerId === userId;
    const isOrganizer = findTransactionById.events.organizer.userId === userId;

    if (!isCustomer && !isOrganizer)
      throw new AppError(403, "You are not allowed to see this payment proof");

    return await prisma.paymentProofs.findMany({
      where: {
        transactionId: params.transactionId,
        deletedAt: null,
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });
  }
}
