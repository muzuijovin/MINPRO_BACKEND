import { prisma } from "../../config/prisma-cllient.config";
import { AppError } from "../../errors/app.error";
import { Prisma } from "../../generated/prisma/client";
import { ReviewsCreateSchema, ReviewsGetSchema } from "../../validatiors/reviews.validator";

export class ReviewsServices {
  static async createReview({ body }: ReviewsCreateSchema, customerId: string) {
    const now = new Date();

    const findEventById = await prisma.events.findFirst({
      where: {
        id: body.eventId,
        deletedAt: null,
      },
    });

    if (!findEventById) throw new AppError(404, "Event not found");

    // review cuma boleh setelah event selesai (kalau endsAt kosong pakai startsAt)
    const eventFinishedAt = findEventById.endsAt ?? findEventById.startsAt;

    if (!eventFinishedAt || eventFinishedAt > now)
      throw new AppError(400, "You can only review an event after it has finished");

    // dianggap hadir kalau customer punya transaksi PAID di event ini
    const findPaidTransaction = await prisma.transactions.findFirst({
      where: {
        customerId,
        eventId: body.eventId,
        status: "PAID",
        deletedAt: null,
      },
    });

    if (!findPaidTransaction)
      throw new AppError(403, "You can only review an event you have attended");

    // 1 customer cuma boleh kasih 1 review per event
    const findExistingReview = await prisma.reviews.findFirst({
      where: {
        customerId,
        eventId: body.eventId,
        deletedAt: null,
      },
    });

    if (findExistingReview) throw new AppError(409, "You have already reviewed this event");

    return await prisma.reviews.create({
      data: {
        customerId,
        eventId: body.eventId,
        rating: body.rating,
        comment: body.comment,
      },
    });
  }

  static async getReviews({ query }: ReviewsGetSchema) {
    const offset = (query?.page - 1) * query?.limit;

    // review yang sudah di soft delete tidak ikut ditampilkan
    const where: Prisma.ReviewsWhereInput = {
      deletedAt: null,
    };

    if (query?.eventId) where.eventId = query.eventId;

    if (query?.organizerId) where.events = { organizerId: query.organizerId };

    // findMany, count & rata-rata rating dijalankan barengan biar lebih cepat
    const [reviews, totalReviews, ratingSummary] = await Promise.all([
      prisma.reviews.findMany({
        where,
        take: query?.limit,
        skip: offset,
        include: {
          users: {
            select: {
              username: true,
              customerProfile: { select: { fullname: true, avatarUrl: true } },
            },
          },
          events: {
            select: { id: true, title: true, slug: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.reviews.count({ where }),
      prisma.reviews.aggregate({
        where,
        _avg: { rating: true },
      }),
    ]);

    const totalPage = Math.ceil(totalReviews / query.limit);

    // dibulatkan 1 angka di belakang koma, misal 4.3
    const averageRating = Math.round((ratingSummary._avg.rating ?? 0) * 10) / 10;

    return {
      page: query?.page,
      totalPage,
      limit: query?.limit,
      reviews,
      totalReviews,
      averageRating,
    };
  }
}
