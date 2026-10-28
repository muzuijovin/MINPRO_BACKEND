import { prisma } from "../../config/prisma-cllient.config";
import { AppError } from "../../errors/app.error";
import { Prisma } from "../../generated/prisma/client";
import {
  VoucherCreateSchema,
  VoucherDeletedSchema,
  VoucherGetDetailSchema,
  VoucherGetSchema,
  VoucherUpdatedSchema,
} from "../../validatiors/voucher.validator";

export class VoucherServices {
  static async createVoucher({ body }: VoucherCreateSchema, userId: string) {
    // eventId nya harus ada dlu, kalau ga ada ke throw new AppError
    const findEventById = await prisma.events.findFirst({
      where: {
        id: body.eventId,
        deletedAt: null,
      },
      include: {
        organizer: {
          select: { userId: true },
        },
      },
    });

    if (!findEventById) throw new AppError(404, `eventId not found`);

    // EO cuma boleh bikin voucher untuk event miliknya sendiri (userId dari token)
    if (findEventById.organizer.userId !== userId)
      throw new AppError(403, `You are not the organizer of this event`);

    // voucher tidak boleh berakhir setelah event selesai
    this.validateAgainstEvent(new Date(body.endAt), findEventById.endsAt);

    // kode voucher harus unik per event
    await this.ensureCodeAvailable(body.eventId, body.code);

    const create = await prisma.eventVoucher.create({
      data: {
        eventId: body.eventId,
        code: body.code,
        discountPercentage: body.discountPercentage,
        quota: body.quota,
        startAt: body.startAt,
        endAt: body.endAt,
        isActive: body.isActive,
      },
    });

    return create;
  }

  static async getVoucher({ query }: VoucherGetSchema) {
    const offset = (query?.page - 1) * query?.limit;

    // voucher yang sudah di soft delete tidak ikut ditampilkan
    const where: Prisma.EventVoucherWhereInput = {
      deletedAt: null,
    };

    if (query?.eventId) where.eventId = query.eventId;

    if (query?.search) {
      where.code = { contains: query.search, mode: "insensitive" };
    }

    // findMany & count dijalankan barengan biar lebih cepat
    const [vouchers, totalVouchers] = await Promise.all([
      prisma.eventVoucher.findMany({
        where,
        take: query?.limit,
        skip: offset,
        include: {
          events: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.eventVoucher.count({ where }),
    ]);

    const totalPage = Math.ceil(totalVouchers / query.limit);

    return {
      page: query?.page,
      totalPage,
      limit: query?.limit,
      vouchers,
      totalVouchers,
    };
  }

  static async getVoucherDetail({ params }: VoucherGetDetailSchema) {
    const voucher = await prisma.eventVoucher.findFirst({
      where: {
        id: params?.id,
        deletedAt: null,
      },
      include: {
        events: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!voucher) throw new AppError(404, "id voucher not found");

    return voucher;
  }

  static async deleteVoucher({ params }: VoucherDeletedSchema, userId: string) {
    // find id nya dulu di params. kalau ga ketemu.. throw ke appError
    const findVoucherById = await prisma.eventVoucher.findFirst({
      where: {
        id: params?.id,
        deletedAt: null,
      },
      include: {
        events: {
          select: { organizer: { select: { userId: true } } },
        },
      },
    });

    if (!findVoucherById) throw new AppError(404, "id voucher not found");

    // EO cuma boleh hapus voucher dari event miliknya sendiri (userId dari token)
    if (findVoucherById.events.organizer.userId !== userId)
      throw new AppError(403, `You are not the organizer of this event`);

    // soft delete + dinonaktifkan, biar voucher yang sudah dihapus pasti tidak bisa dipakai lagi
    const deleteData = await prisma.eventVoucher.update({
      where: {
        id: params?.id,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return deleteData;
  }

  static async updateVoucher(
    { params, body }: VoucherUpdatedSchema,
    userId: string,
  ) {
    // cek id nya apakah ada
    const findVoucherById = await prisma.eventVoucher.findFirst({
      where: {
        id: params?.id,
        deletedAt: null,
      },
      include: {
        events: {
          include: {
            organizer: { select: { userId: true } },
          },
        },
      },
    });

    if (!findVoucherById) throw new AppError(404, "id voucher not found");

    // EO cuma boleh ubah voucher dari event miliknya sendiri (userId dari token)
    if (findVoucherById.events.organizer.userId !== userId)
      throw new AppError(403, `You are not the organizer of this event`);

    // validasi gabungan data lama + data baru (misal cuma kirim endAt, tetap dicek terhadap startAt lama)
    const startAt = body?.startAt ? new Date(body.startAt) : findVoucherById.startAt;
    const endAt = body?.endAt ? new Date(body.endAt) : findVoucherById.endAt;

    if (endAt <= startAt)
      throw new AppError(422, "End date must be after start date");

    this.validateAgainstEvent(endAt, findVoucherById.events.endsAt);

    // kalau kode diganti, pastikan belum dipakai voucher lain di event yang sama
    if (body?.code && body.code !== findVoucherById.code) {
      await this.ensureCodeAvailable(findVoucherById.eventId, body.code);
    }

    return await prisma.eventVoucher.update({
      where: {
        id: params?.id,
      },
      data: {
        code: body?.code,
        discountPercentage: body?.discountPercentage,
        quota: body?.quota,
        startAt: body?.startAt,
        endAt: body?.endAt,
        isActive: body?.isActive,
      },
    });
  }

  // nonaktifkan semua voucher yang endAt nya sudah lewat, dipanggil dari scheduler (node-cron / vercel cron)
  // pakai updateMany biar cukup 1 query untuk semua voucher
  static async deactivateExpiredVouchers() {
    const result = await prisma.eventVoucher.updateMany({
      where: {
        isActive: true,
        deletedAt: null,
        endAt: { lt: new Date() },
      },
      data: {
        isActive: false,
      },
    });

    return result.count;
  }

  // voucher tidak boleh berlaku setelah event selesai (kalau event belum punya endsAt, skip)
  static validateAgainstEvent(endAt: Date, eventEndsAt: Date | null) {
    if (eventEndsAt && endAt > eventEndsAt)
      throw new AppError(422, "Voucher end date cannot be after the event ends");
  }

  // cek duplikat kode di event yang sama, termasuk voucher yang sudah di soft delete
  // karena @@unique([eventId, code]) di database tetap berlaku untuk row yang deletedAt nya terisi
  static async ensureCodeAvailable(eventId: string, code: string) {
    const findVoucherByCode = await prisma.eventVoucher.findUnique({
      where: {
        eventId_code: { eventId, code },
      },
    });

    if (findVoucherByCode)
      throw new AppError(409, `voucher code ${code} already exists for this event`);
  }
}
