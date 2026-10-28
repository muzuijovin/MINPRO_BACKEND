import { randomUUID } from "crypto";
import { prisma } from "../../config/prisma-cllient.config";
import { AppError } from "../../errors/app.error";
import { cloudinaryUpload } from "../../lib/claudinary.lib";
import {
  TransactionsConfirmSchema,
  TransactionsCreateSchema,
  TransactionsUploadProofSchema,
} from "../../validatiors/transactions.validator";

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// batas waktu customer upload bukti bayar setelah checkout
const PAYMENT_DEADLINE_MINUTES = 10;

// batas waktu EO accept / reject setelah bukti bayar diupload
const CONFIRMATION_DEADLINE_DAYS = 3;

// poin yang dikembalikan berlaku lagi 3 bulan (sama dengan masa berlaku poin referral)
const REFUNDED_POINTS_EXPIRY_MONTHS = 3;

export class TransactionsServices {
  static async checkout({ body }: TransactionsCreateSchema, customerId: string) {
    const now = new Date();

    const findCustomerById = await prisma.users.findFirst({
      where: {
        id: customerId,
        deletedAt: null,
      },
    });

    if (!findCustomerById) throw new AppError(404, "Customer not found");

    const findEventById = await prisma.events.findFirst({
      where: {
        id: body.eventId,
        deletedAt: null,
      },
    });

    if (!findEventById) throw new AppError(404, "Event not found");

    // tiket tidak bisa dibeli kalau event sudah mulai / lewat
    if (findEventById.startsAt && findEventById.startsAt <= now)
      throw new AppError(400, "Event has already started");

    if (findEventById.quota < body.quantity)
      throw new AppError(400, `Only ${findEventById.quota} seats left`);

    const isFreeEvent = findEventById.typePrice === "FREE";

    // event gratis tidak perlu diskon, biar voucher/coupon/poin customer tidak kebuang
    if (isFreeEvent && (body.eventVoucherId || body.userCouponId || body.pointUsed > 0))
      throw new AppError(400, "Voucher, coupon and points cannot be used on a free event");

    // rekening tujuan transfer harus milik EO pemilik event dan masih aktif
    const findBankAccountById = await prisma.organizerBankAccounts.findFirst({
      where: {
        id: body.bankAccountId,
        organizerId: findEventById.organizerId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!findBankAccountById) throw new AppError(404, "Bank account not found for this event");

    // harga tiket di snapshot saat checkout, jadi kalau EO ubah harga transaksi lama tidak ikut berubah
    const ticketPrice = Number(findEventById.price);
    const subtotal = ticketPrice * body.quantity;

    let voucherDiscount = 0;
    if (body.eventVoucherId) {
      // voucher hanya berlaku untuk event ini
      const findVoucherById = await prisma.eventVoucher.findFirst({
        where: {
          id: body.eventVoucherId,
          eventId: body.eventId,
          isActive: true,
          deletedAt: null,
          quota: { gt: 0 },
          startAt: { lte: now },
          endAt: { gte: now },
        },
      });

      if (!findVoucherById) throw new AppError(400, "Voucher is invalid or expired");

      voucherDiscount = Math.floor((subtotal * Number(findVoucherById.discountPercentage)) / 100);
    }

    let couponDiscount = 0;
    if (body.userCouponId) {
      // coupon reward berlaku di semua event, tapi harus milik customer ini
      const findCouponById = await prisma.coupons.findFirst({
        where: {
          id: body.userCouponId,
          userId: customerId,
          isActive: true,
          deletedAt: null,
          quota: { gt: 0 },
          startAt: { lte: now },
          endAt: { gte: now },
        },
      });

      if (!findCouponById) throw new AppError(400, "Coupon is invalid or expired");

      couponDiscount = Math.floor((subtotal * Number(findCouponById.discountPercentage)) / 100);
    }

    const amountAfterDiscount = Math.max(subtotal - voucherDiscount - couponDiscount, 0);

    // 1 poin = Rp1, poin tidak boleh melebihi sisa tagihan biar tidak kebuang
    if (body.pointUsed > amountAfterDiscount)
      throw new AppError(400, `Points used cannot exceed Rp${amountAfterDiscount}`);

    const pointDiscount = body.pointUsed;
    const finalAmount = amountAfterDiscount - pointDiscount;

    // tagihan 0 (event gratis / full diskon) tidak perlu upload bukti bayar, langsung PAID
    const isPaid = finalAmount === 0;

    // semua perubahan data dibungkus 1 SQL transaction, kalau salah satu gagal semuanya di rollback
    return await prisma.$transaction(async (tx) => {
      // decrement pakai kondisi quota >= quantity biar aman dari race condition (2 customer checkout bersamaan)
      const updateEventQuota = await tx.events.updateMany({
        where: { id: body.eventId, quota: { gte: body.quantity } },
        data: { quota: { decrement: body.quantity } },
      });

      if (updateEventQuota.count === 0) throw new AppError(400, "Seats are no longer available");

      if (body.eventVoucherId) {
        const updateVoucherQuota = await tx.eventVoucher.updateMany({
          where: { id: body.eventVoucherId, quota: { gt: 0 } },
          data: { quota: { decrement: 1 } },
        });

        if (updateVoucherQuota.count === 0) throw new AppError(400, "Voucher quota has run out");
      }

      if (body.userCouponId) {
        const updateCouponQuota = await tx.coupons.updateMany({
          where: { id: body.userCouponId, quota: { gt: 0 } },
          data: { quota: { decrement: 1 } },
        });

        if (updateCouponQuota.count === 0) throw new AppError(400, "Coupon quota has run out");
      }

      if (body.pointUsed > 0) await this.usePoints(tx, customerId, body.pointUsed, now);

      return await tx.transactions.create({
        data: {
          customerId,
          eventId: body.eventId,
          bankAccountId: body.bankAccountId,
          eventVoucherId: body.eventVoucherId ?? null,
          userCouponId: body.userCouponId ?? null,
          quantity: body.quantity,
          ticketPrice,
          transactionCode: this.generateTransactionCode(),
          subtotal,
          voucherDiscount,
          couponDiscount,
          pointUsed: body.pointUsed,
          pointDiscount,
          finalAmount,
          status: isPaid ? "PAID" : "WAITING_FOR_PAYMENT",
          paymentDeadline: isPaid ? null : new Date(now.getTime() + PAYMENT_DEADLINE_MINUTES * 60 * 1000),
          confirmedAt: isPaid ? now : null,
          // tiket langsung terbit kalau sudah PAID, 1 row per tiket
          tickets: isPaid
            ? { create: Array.from({ length: body.quantity }, () => ({ issuedAt: now })) }
            : undefined,
        },
        include: { tickets: true },
      });
    });
  }

  // customer upload bukti transfer -> status jadi WAITING_FOR_CONFIRMATION
  static async uploadPaymentProof(
    { params }: TransactionsUploadProofSchema,
    file: Express.Multer.File | undefined,
    customerId: string,
  ) {
    if (!file) throw new AppError(422, "Payment proof is required");

    const now = new Date();

    const findTransactionById = await prisma.transactions.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
      },
      include: {
        events: {
          include: { organizer: { select: { userId: true } } },
        },
      },
    });

    if (!findTransactionById) throw new AppError(404, "Transaction not found");

    // customer cuma boleh upload bukti untuk transaksinya sendiri
    if (findTransactionById.customerId !== customerId)
      throw new AppError(403, "You are not the owner of this transaction");

    if (findTransactionById.status !== "WAITING_FOR_PAYMENT")
      throw new AppError(400, `Cannot upload payment proof, transaction status is ${findTransactionById.status}`);

    if (findTransactionById.paymentDeadline && findTransactionById.paymentDeadline < now)
      throw new AppError(400, "Payment deadline has passed");

    const storagePath = await cloudinaryUpload(file.buffer);

    return await prisma.$transaction(async (tx) => {
      // update pakai kondisi status biar tidak dobel kalau customer upload 2x bersamaan
      const updateTransaction = await tx.transactions.updateMany({
        where: { id: params.id, status: "WAITING_FOR_PAYMENT" },
        data: {
          status: "WAITING_FOR_CONFIRMATION",
          submittedProofAt: now,
          confirmationDeadline: new Date(now.getTime() + CONFIRMATION_DEADLINE_DAYS * 24 * 60 * 60 * 1000),
        },
      });

      if (updateTransaction.count === 0) throw new AppError(400, "Transaction status has changed");

      // reviewedBy diisi user EO pemilik event, karena dia yang nanti accept / reject
      await tx.paymentProofs.create({
        data: {
          transactionId: params.id,
          storagePath: `${storagePath}`,
          uploadedAt: now,
          reviewedBy: findTransactionById.events.organizer.userId,
        },
      });

      return await tx.transactions.findUnique({
        where: { id: params.id },
        include: { paymentProofs: true },
      });
    });
  }

  // EO accept -> PAID & tiket terbit, reject -> REJECTED & kursi/voucher/coupon/poin dikembalikan
  static async confirmPayment({ params, body }: TransactionsConfirmSchema, userId: string) {
    const now = new Date();

    const findTransactionById = await prisma.transactions.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
      },
      include: {
        events: {
          include: { organizer: { select: { userId: true } } },
        },
      },
    });

    if (!findTransactionById) throw new AppError(404, "Transaction not found");

    // EO cuma boleh confirm transaksi dari event miliknya sendiri
    if (findTransactionById.events.organizer.userId !== userId)
      throw new AppError(403, "You are not the organizer of this event");

    if (findTransactionById.status !== "WAITING_FOR_CONFIRMATION")
      throw new AppError(400, `Cannot confirm payment, transaction status is ${findTransactionById.status}`);

    const isAccepted = body.decision === "ACCEPTED";

    return await prisma.$transaction(async (tx) => {
      const updateTransaction = await tx.transactions.updateMany({
        where: { id: params.id, status: "WAITING_FOR_CONFIRMATION" },
        data: isAccepted
          ? { status: "PAID", confirmedAt: now }
          : { status: "REJECTED", rejectedAt: now },
      });

      if (updateTransaction.count === 0) throw new AppError(400, "Transaction status has changed");

      // bukti bayar yang masih PENDING ikut di update sesuai keputusan EO
      await tx.paymentProofs.updateMany({
        where: { transactionId: params.id, decision: "PENDING" },
        data: {
          decision: body.decision,
          reviewedBy: userId,
          reviewedAt: now,
        },
      });

      if (isAccepted) {
        // tiket terbit setelah pembayaran diterima, 1 row per tiket
        await tx.tickets.createMany({
          data: Array.from({ length: findTransactionById.quantity }, () => ({
            transactionsId: params.id,
            issuedAt: now,
          })),
        });
      } else {
        await this.restoreTransactionResources(tx, findTransactionById, now);
      }

      return await tx.transactions.findUnique({
        where: { id: params.id },
        include: { paymentProofs: true, tickets: true },
      });
    });
  }

  // dipakai saat transaksi REJECTED (nanti juga EXPIRED / CANCELLED): kembalikan kursi, voucher, coupon & poin
  private static async restoreTransactionResources(
    tx: PrismaTx,
    transaction: {
      customerId: string;
      eventId: string;
      eventVoucherId: string | null;
      userCouponId: string | null;
      quantity: number;
      pointUsed: number;
    },
    now: Date,
  ) {
    await tx.events.update({
      where: { id: transaction.eventId },
      data: { quota: { increment: transaction.quantity } },
    });

    if (transaction.eventVoucherId) {
      await tx.eventVoucher.update({
        where: { id: transaction.eventVoucherId },
        data: { quota: { increment: 1 } },
      });
    }

    if (transaction.userCouponId) {
      await tx.coupons.update({
        where: { id: transaction.userCouponId },
        data: { quota: { increment: 1 } },
      });
    }

    if (transaction.pointUsed > 0) {
      // lot asal poin tidak disimpan di transaksi, jadi poin dikembalikan sebagai lot baru
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + REFUNDED_POINTS_EXPIRY_MONTHS);

      await tx.pointLots.create({
        data: {
          userId: transaction.customerId,
          pointsRemaining: transaction.pointUsed,
          expiresAt,
        },
      });

      await tx.users.update({
        where: { id: transaction.customerId },
        data: { totalPoints: { increment: transaction.pointUsed } },
      });
    }
  }

  // potong poin dari lot yang paling cepat expired dulu (FIFO), lot yang sudah expired tidak dihitung
  private static async usePoints(
    tx: PrismaTx,
    customerId: string,
    pointUsed: number,
    now: Date,
  ) {
    const pointLots = await tx.pointLots.findMany({
      where: {
        userId: customerId,
        status: { in: ["AVAILABLE", "PARTIALLY_USED"] },
        pointsRemaining: { gt: 0 },
        expiresAt: { gt: now },
        deletedAt: null,
      },
      orderBy: { expiresAt: "asc" },
    });

    const availablePoints = pointLots.reduce((total, lot) => total + lot.pointsRemaining, 0);

    if (availablePoints < pointUsed)
      throw new AppError(400, `Not enough points, you only have ${availablePoints} points`);

    let remaining = pointUsed;
    for (const lot of pointLots) {
      if (remaining === 0) break;

      const deduct = Math.min(lot.pointsRemaining, remaining);
      const pointsRemaining = lot.pointsRemaining - deduct;

      await tx.pointLots.update({
        where: { id: lot.id },
        data: {
          pointsRemaining,
          status: pointsRemaining === 0 ? "FULLY_USED" : "PARTIALLY_USED",
        },
      });

      remaining -= deduct;
    }

    await tx.users.update({
      where: { id: customerId },
      data: { totalPoints: { decrement: pointUsed } },
    });
  }

  // contoh: TRX-1730100000000-A1B2C3
  private static generateTransactionCode() {
    return `TRX-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
  }
}
