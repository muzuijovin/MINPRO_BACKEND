import { prisma } from "../../config/prisma-cllient.config";
import { AppError } from "../../errors/app.error";
import { Prisma } from "../../generated/prisma/client";
import { cloudinaryUpload } from "../../lib/claudinary.lib";
import {
  EventsCreateSchema,
  EventsDeletedSchema,
  EventsGetDetailSchema,
  EventsGetSchema,
  EventUpdatedSchema,
} from "../../validatiors/events.validators";
import { generateSlug } from "../../utlis/slug";

export class EventsService {
  static async createEvent(
    { body }: EventsCreateSchema,
    files: Express.Multer.File[],
    userId: string,
  ) {
    // cover image wajib diupload
    if (!files[0]) throw new AppError(422, "Cover image is required");

    // cari organizer profile milik user yang login (userId dari token), kalau gaada ke throw
    const findOrganizer = await prisma.organizerProfiles.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!findOrganizer) throw new AppError(404, `Organizer profile not found`);

    // find categoryId, kalau misal gaada / sudah dihapus, ke throw
    const findCategoryById = await prisma.categories.findFirst({
      where: {
        id: body.categoryId,
        deletedAt: null,
      },
    });

    if (!findCategoryById) throw new AppError(404, `categoryId not found`);

    // Generate slug otomatis berdasarkan title (judul boleh sama, slug yang dibuat unik)
    const slug = await this.generateUniqueSlug(body.title);

    const cloudinaryUploadedUrl = await cloudinaryUpload(files[0].buffer);

    return await prisma.events.create({
      data: {
        slug,
        title: body.title,
        description: body.description,
        location: body.location,
        format: body.format,
        typePrice: body.typePrice,
        price: body.price,
        coverImageUrl: `${cloudinaryUploadedUrl}`,
        quota: body.quota,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        organizer: {
          connect: { id: findOrganizer.id },
        },

        categories: {
          connect: { id: body.categoryId },
        },
      },
    });
  }

  static async getEvent({ query }: EventsGetSchema) {
    const offset = (query?.page - 1) * query?.limit;
    const now = new Date();

    const where: Prisma.EventsWhereInput = {
      deletedAt: null,
    };

    // search bar: cari keyword di title, description atau location
    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { location: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // filter category berdasarkan slug, termasuk sub category nya
    if (query?.category) {
      const categoryIds = await this.getCategoryIdsBySlug(query.category);

      // category tidak ditemukan -> hasilnya kosong (bukan error), biar FE bisa nampilin "no events found"
      if (categoryIds.length === 0) {
        return {
          page: query?.page,
          totalPage: 0,
          limit: query?.limit,
          events: [],
          totalEvents: 0,
        };
      }

      where.categoryId = { in: categoryIds };
    }

    if (query?.location) {
      where.location = { contains: query.location, mode: "insensitive" };
    }

    if (query?.typePrice) where.typePrice = query.typePrice;
    if (query?.format) where.format = query.format;
    if (query?.organizerId) where.organizerId = query.organizerId;

    if (query?.time === "upcoming") where.startsAt = { gte: now };
    if (query?.time === "past") where.startsAt = { lt: now };

    // findMany & count dijalankan barengan biar lebih cepat
    const [events, totalEvents] = await Promise.all([
      prisma.events.findMany({
        where,
        take: query?.limit,
        skip: offset,
        include: {
          organizer: {
            select: {
              id: true,
              organizationName: true,
            },
          },
          categories: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          [query.sortBy]: query.order,
        },
      }),
      prisma.events.count({ where }),
    ]);

    const totalPage = Math.ceil(totalEvents / query.limit);

    return {
      page: query?.page,
      totalPage,
      limit: query?.limit,
      events,
      totalEvents,
    };
  }

  static async getEventDetail({ params }: EventsGetDetailSchema) {
    const now = new Date();

    // findFirst & aggregate rating dijalankan barengan (aggregate filter lewat slug event)
    const [event, rating] = await Promise.all([
      prisma.events.findFirst({
      where: {
        slug: params?.slug,
        deletedAt: null,
      },
      include: {
        organizer: {
          select: {
            id: true,
            organizationName: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        // hanya voucher yang masih berlaku yang ditampilkan ke customer
        eventVoucher: {
          where: {
            deletedAt: null,
            isActive: true,
            quota: { gt: 0 },
            startAt: { lte: now },
            endAt: { gte: now },
          },
          select: {
            id: true,
            code: true,
            discountPercentage: true,
            quota: true,
            startAt: true,
            endAt: true,
          },
        },
      },
      }),
      prisma.reviews.aggregate({
        where: {
          events: { slug: params?.slug, deletedAt: null },
          deletedAt: null,
        },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    if (!event) throw new AppError(404, `event not found`);

    return {
      event: {
        ...event,
        averageRating: rating._avg.rating ?? 0,
        totalReviews: rating._count.rating,
      },
    };
  }

  // list lokasi unik, dipakai untuk dropdown filter lokasi di FE
  static async getEventLocations() {
    const locations = await prisma.events.findMany({
      where: {
        deletedAt: null,
      },
      distinct: ["location"],
      select: {
        location: true,
      },
      orderBy: {
        location: "asc",
      },
    });

    return { locations: locations.map((item) => item.location) };
  }

  static async deleteEvent({ params }: EventsDeletedSchema, userId: string) {
    // find id, kalau misal gaada di table, ke throw
    const findEventById = await prisma.events.findFirst({
      where: {
        id: params?.id,
        deletedAt: null,
      },
      include: {
        organizer: {
          select: { userId: true },
        },
      },
    });

    if (!findEventById) throw new AppError(404, `event not found`);

    // EO cuma boleh hapus event miliknya sendiri (userId dari token)
    if (findEventById.organizer.userId !== userId)
      throw new AppError(403, `You are not the organizer of this event`);

    const deletedEvents = await prisma.events.update({
      data: {
        deletedAt: new Date(),
      },
      where: {
        id: params?.id,
      },
    });

    return {
      deletedEvents,
    };
  }

  static async updatedEvents(
    { params, body }: EventUpdatedSchema,
    userId: string,
  ) {
    // find id, kalau misal gaada di table, ke throw
    const findEventsById = await prisma.events.findFirst({
      where: {
        id: params?.id,
        deletedAt: null,
      },
      include: {
        organizer: {
          select: { userId: true },
        },
      },
    });

    if (!findEventsById) throw new AppError(404, `event not found`);

    // EO cuma boleh ubah event miliknya sendiri (userId dari token)
    if (findEventsById.organizer.userId !== userId)
      throw new AppError(403, `You are not the organizer of this event`);

    // kalau categoryId diganti, pastikan category nya ada
    if (body?.categoryId) {
      const findCategoryById = await prisma.categories.findFirst({
        where: {
          id: body.categoryId,
          deletedAt: null,
        },
      });

      if (!findCategoryById) throw new AppError(404, `categoryId not found`);
    }

    // validasi gabungan data lama + data baru (misal cuma kirim endsAt, tetap dicek terhadap startsAt lama)
    const typePrice = body?.typePrice ?? findEventsById.typePrice;
    const price = body?.price ?? Number(findEventsById.price);
    const startsAt = body?.startsAt !== undefined ? body.startsAt : findEventsById.startsAt;
    const endsAt = body?.endsAt !== undefined ? body.endsAt : findEventsById.endsAt;

    if (typePrice === "FREE" && price !== 0)
      throw new AppError(422, "Free events must have a price of 0");
    if (typePrice === "PAID" && price <= 0)
      throw new AppError(422, "Paid events must have a price greater than 0");
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt))
      throw new AppError(422, "End date must be after start date");

    const updateEvents = await prisma.events.update({
      where: {
        id: params?.id,
      },
      data: {
        categoryId: body?.categoryId,
        title: body?.title,
        description: body?.description,
        location: body?.location,
        format: body?.format,
        typePrice: body?.typePrice,
        price: body?.price,
        quota: body?.quota,
        startsAt: body?.startsAt,
        endsAt: body?.endsAt,
      },
    });

    return{
      updateEvents
    }
  }

  // ambil id category + id sub category nya berdasarkan slug
  static async getCategoryIdsBySlug(slug: string): Promise<string[]> {
    const category = await prisma.categories.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!category) return [];

    const children = await prisma.categories.findMany({
      where: {
        parentId: category.id,
        deletedAt: null,
      },
      select: { id: true },
    });

    return [category.id, ...children.map((child) => child.id)];
  }

  static async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;

    while (
      await prisma.events.findUnique({
        where: { slug },
        select: { id: true },
      })
    ) {
      counter++;

      const suffix = `-${counter}`;
      slug = `${baseSlug.slice(0, 250 - suffix.length)}${suffix}`;
    }

    return slug;
  }
}
