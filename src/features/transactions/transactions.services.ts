import { randomUUID } from "crypto";
import { prisma } from "../../config/prisma-cllient.config";
import { AppError } from "../../errors/app.error";
import { Prisma } from "../../generated/prisma/client";
import { cloudinaryUpload } from "../../lib/claudinary.lib";
import { NotificationsServices } from "../notifications/notifications.services";
import {
  TransactionsConfirmSchema,
  TransactionsCreateSchema,
  TransactionsGetDetailSchema,
  TransactionsGetSchema,
  TransactionsUploadProofSchema,
} from "../../validatiors/transactions.validator";

// data event yang ikut ditampilkan di history & detail transaksi
const eventSelect = {
  id: true,
  title: true,
  slug: true,
  location: true,
  coverImageUrl: true,
  startsAt: true,
  endsAt: true,
} satisfies Prisma.EventsSelect;

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// data transaksi yang dibutuhkan untuk mengembalikan kursi, voucher, coupon & poin
type TransactionToRestore = {
  id: string;
  customerId: string;
  eventId: string;
  eventVoucherId: string | null;
  userCouponId: string | null;
  quantity: number;
  pointUsed: number;
};

// data transaksi yang di-expire / cancel scheduler, ditambah info untuk isi notifikasi
type TransactionToClose = TransactionToRestore & {
  transactionCode: string;
  events: { title: string; organizer: { userId: string } };
};

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

  // history transaksi milik customer yang login (dashboard customer)
  static async getMyTransactions({ query }: TransactionsGetSchema, customerId: string) {
    const offset = (query?.page - 1) * query?.limit;

    const where: Prisma.TransactionsWhereInput = {
      customerId,
      deletedAt: null,
    };

    if (query?.status) where.status = query.status;

    if (query?.eventId) where.eventId = query.eventId;

    // search bisa pakai kode transaksi atau judul event
    if (query?.search) {
      where.OR = [
        { transactionCode: { contains: query.search, mode: "insensitive" } },
        { events: { title: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    // findMany & count dijalankan barengan biar lebih cepat
    const [transactions, totalTransactions] = await Promise.all([
      prisma.transactions.findMany({
        where,
        take: query?.limit,
        skip: offset,
        include: {
          events: { select: eventSelect },
          _count: { select: { tickets: true } },
        },
        orderBy: {
          [query.sortBy]: query.order,
        },
      }),
      prisma.transactions.count({ where }),
    ]);

    const totalPage = Math.ceil(totalTransactions / query.limit);

    return {
      page: query?.page,
      totalPage,
      limit: query?.limit,
      transactions,
      totalTransactions,
    };
  }

  // transaksi dari semua event milik EO yang login (kelola transaksi & daftar peserta di dashboard EO)
  static async getOrganizerTransactions({ query }: TransactionsGetSchema, userId: string) {
    const offset = (query?.page - 1) * query?.limit;

    const where: Prisma.TransactionsWhereInput = {
      events: { organizer: { userId } },
      deletedAt: null,
    };

    if (query?.status) where.status = query.status;

    if (query?.eventId) where.eventId = query.eventId;

    // search bisa pakai kode transaksi, judul event atau username customer
    if (query?.search) {
      where.OR = [
        { transactionCode: { contains: query.search, mode: "insensitive" } },
        { events: { title: { contains: query.search, mode: "insensitive" } } },
        { users: { username: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    const [transactions, totalTransactions] = await Promise.all([
      prisma.transactions.findMany({
        where,
        take: query?.limit,
        skip: offset,
        include: {
          events: { select: eventSelect },
          // data peserta: nama, jumlah tiket (quantity) & total bayar (finalAmount) sudah ada di transaksi
          users: {
            select: {
              id: true,
              username: true,
              email: true,
              customerProfile: { select: { fullname: true } },
            },
          },
          _count: { select: { tickets: true } },
        },
        orderBy: {
          [query.sortBy]: query.order,
        },
      }),
      prisma.transactions.count({ where }),
    ]);

    const totalPage = Math.ceil(totalTransactions / query.limit);

    return {
      page: query?.page,
      totalPage,
      limit: query?.limit,
      transactions,
      totalTransactions,
    };
  }

  // detail 1 transaksi, bisa dilihat customer pemilik transaksi & EO pemilik event
  static async getTransactionDetail({ params }: TransactionsGetDetailSchema, userId: string) {
    const transaction = await prisma.transactions.findFirst({
      where: {
        id: params?.id,
        deletedAt: null,
      },
      include: {
        events: {
          select: {
            ...eventSelect,
            organizer: { select: { userId: true, organizationName: true } },
          },
        },
        bankEo: {
          select: { bankName: true, accountNumber: true, accountHolder: true },
        },
        eventVoucher: { select: { code: true, discountPercentage: true } },
        coupons: { select: { code: true, discountPercentage: true } },
        paymentProofs: {
          where: { deletedAt: null },
          orderBy: { uploadedAt: "desc" },
        },
        tickets: {
          where: { deletedAt: null },
          select: { id: true, status: true, issuedAt: true },
        },
      },
    });

    if (!transaction) throw new AppError(404, "Transaction not found");

    const isCustomer = transaction.customerId === userId;
    const isOrganizer = transaction.events.organizer.userId === userId;

    if (!isCustomer && !isOrganizer)
      throw new AppError(403, "You are not allowed to see this transaction");

    return transaction;
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

      await NotificationsServices.createNotifications(tx, [
        {
          userId: findTransactionById.events.organizer.userId,
          transactionId: params.id,
          type: "PAYMENT_PROOF_UPLOADED",
          title: "New payment proof",
          message: `Transaction ${findTransactionById.transactionCode} for "${findTransactionById.events.title}" is waiting for your confirmation.`,
        },
      ]);

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

      const { transactionCode, events } = findTransactionById;

      await NotificationsServices.createNotifications(tx, [
        isAccepted
          ? {
              userId: findTransactionById.customerId,
              transactionId: params.id,
              type: "PAYMENT_ACCEPTED",
              title: "Payment accepted",
              message: `Your payment for "${events.title}" (${transactionCode}) has been accepted. Your tickets are ready.`,
            }
          : {
              userId: findTransactionById.customerId,
              transactionId: params.id,
              type: "PAYMENT_REJECTED",
              title: "Payment rejected",
              message: `Your payment for "${events.title}" (${transactionCode}) was rejected. Your seats, voucher, coupon and points have been returned.`,
            },
      ]);

      return await tx.transactions.findUnique({
        where: { id: params.id },
        include: { paymentProofs: true, tickets: true },
      });
    });
  }

  // dijalankan scheduler tiap menit:
  // - tidak upload bukti bayar dalam 10 menit -> EXPIRED
  // - EO tidak accept / reject dalam 3 hari -> CANCELLED
  // kursi, voucher, coupon & poin dikembalikan ke customer
  static async expireOverdueTransactions() {
    const now = new Date();

    // judul event & user EO dibutuhkan untuk isi notifikasi
    const includeEvent = {
      events: { select: { title: true, organizer: { select: { userId: true } } } },
    };

    const overduePayments = await prisma.transactions.findMany({
      where: {
        status: "WAITING_FOR_PAYMENT",
        paymentDeadline: { lt: now },
        deletedAt: null,
      },
      include: includeEvent,
    });

    const overdueConfirmations = await prisma.transactions.findMany({
      where: {
        status: "WAITING_FOR_CONFIRMATION",
        confirmationDeadline: { lt: now },
        deletedAt: null,
      },
      include: includeEvent,
    });

    let expired = 0;
    for (const transaction of overduePayments) {
      const isUpdated = await this.closeTransaction(transaction, "WAITING_FOR_PAYMENT", "EXPIRED", now);
      if (isUpdated) expired++;
    }

    let cancelled = 0;
    for (const transaction of overdueConfirmations) {
      const isUpdated = await this.closeTransaction(transaction, "WAITING_FOR_CONFIRMATION", "CANCELLED", now);
      if (isUpdated) cancelled++;
    }

    return { expired, cancelled };
  }

  // ubah status 1 transaksi + kembalikan resource nya, dibungkus 1 SQL transaction
  private static async closeTransaction(
    transaction: TransactionToClose,
    fromStatus: "WAITING_FOR_PAYMENT" | "WAITING_FOR_CONFIRMATION",
    toStatus: "EXPIRED" | "CANCELLED",
    now: Date,
  ) {
    return await prisma.$transaction(async (tx) => {
      // update pakai kondisi status biar tidak dobel, misal customer upload bukti tepat saat scheduler jalan
      const updateTransaction = await tx.transactions.updateMany({
        where: { id: transaction.id, status: fromStatus },
        data:
          toStatus === "EXPIRED"
            ? { status: "EXPIRED", expiredAt: now }
            : { status: "CANCELLED", cancelledAt: now },
      });

      if (updateTransaction.count === 0) return false;

      await this.restoreTransactionResources(tx, transaction, now);

      const { transactionCode, events } = transaction;

      if (toStatus === "EXPIRED") {
        await NotificationsServices.createNotifications(tx, [
          {
            userId: transaction.customerId,
            transactionId: transaction.id,
            type: "TRANSACTION_EXPIRED",
            title: "Transaction expired",
            message: `Your transaction for "${events.title}" (${transactionCode}) expired because no payment proof was uploaded within 10 minutes.`,
          },
        ]);
      } else {
        // dibatalkan karena EO tidak merespons, jadi customer & EO sama-sama dikabari
        await NotificationsServices.createNotifications(tx, [
          {
            userId: transaction.customerId,
            transactionId: transaction.id,
            type: "TRANSACTION_CANCELLED",
            title: "Transaction cancelled",
            message: `Your transaction for "${events.title}" (${transactionCode}) was cancelled because the organizer did not confirm it within 3 days. Your seats, voucher, coupon and points have been returned.`,
          },
          {
            userId: events.organizer.userId,
            transactionId: transaction.id,
            type: "TRANSACTION_CANCELLED",
            title: "Transaction cancelled",
            message: `Transaction ${transactionCode} for "${events.title}" was cancelled automatically because it was not confirmed within 3 days.`,
          },
        ]);
      }

      return true;
    });
  }

  // dipakai saat transaksi REJECTED, EXPIRED & CANCELLED: kembalikan kursi, voucher, coupon & poin
  private static async restoreTransactionResources(
    tx: PrismaTx,
    transaction: TransactionToRestore,
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

      // update cuma jalan kalau sisa poin lot masih sama seperti saat dibaca,
      // biar 2 checkout bersamaan (akun sama, device beda) tidak memakai poin yang sama 2x
      const updatePointLot = await tx.pointLots.updateMany({
        where: { id: lot.id, pointsRemaining: lot.pointsRemaining },
        data: {
          pointsRemaining,
          status: pointsRemaining === 0 ? "FULLY_USED" : "PARTIALLY_USED",
        },
      });

      if (updatePointLot.count === 0)
        throw new AppError(409, "Your points have just been used in another checkout, please try again");

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
