import { prisma } from "../../config/prisma-cllient.config";
import { AppError } from "../../errors/app.error";
import { cloudinaryUpload } from "../../lib/claudinary.lib";
import {
  EventsCreateSchema,
  EventsDeletedSchema,
  EventsGetSchema,
  EventUpdatedSchema,
} from "../../validatiors/events.validators";
import { generateSlug } from "../../utlis/slug";

export class EventsService {
  static async createEvent(
    { body }: EventsCreateSchema,
    files: Express.Multer.File[],
  ) {
    // find id, kalau misal udh ada di table, ke throw
    const findId = await prisma.events.findUnique({
      where: {
        id: body?.id,
      },
    });

    if (findId) throw new AppError(409, `id = ${body.id} has already exists`);

    // find organizerId, kalau misal gaada , ke throw
    const findOrganizerById = await prisma.organizerProfiles.findUnique({
      where: {
        id: body.organizerId,
      },
    });

    if (!findOrganizerById) throw new AppError(404, `organizerId not found`);

    // find categoryId, kalau misal gaada , ke throw
    const findCategoryById = await prisma.categories.findUnique({
      where: {
        id: body.categoryId,
      },
    });

    if (!findCategoryById) throw new AppError(404, `categoryId not found`);

    // 4. Generate slug otomatis berdasarkan title
    const slug = await this.generateUniqueSlug(body.title);

    const cloudinaryUploadedUrl = await cloudinaryUpload(files[0]?.buffer);

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
        startstAt: body.startsAt,
        EndsAt: body.endsAt,
        organizer: {
          connect: { id: body.organizerId },
        },

        categories: {
          connect: { id: body.categoryId },
        },
      },
    });
  }

  static async getEvent({ query }: EventsGetSchema) {
    const offset = (query?.page - 1) * query?.limit;

    const events = await prisma.events.findMany({
      where: {
        deletedAt: null,
      },
      take: query?.limit,
      skip: offset,
      include: {
        organizer: {
          select: {
            organizationName: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const totalEvents = await prisma.events.count({
      where: {
        deletedAt: null,
      },
    });

    const totalPage = Math.ceil(totalEvents / query.limit);

    return {
      page: query?.page,
      totalPage,
      limit: query?.limit,
      events,
      totalEvents,
    };
  }

  static async deleteEvent({ params }: EventsDeletedSchema) {
    // find id, kalau misal gaada di table, ke throw
    const findEventById = await prisma.events.findUnique({
      where: {
        id: params?.id,
      },
    });

    if (!findEventById) throw new AppError(404, `categoryId not found`);

    const deletedEvents = prisma.events.update({
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

  static async updatedEvents({ params, body }: EventUpdatedSchema) {
    // find id, kalau misal gaada di table, ke throw
    const findEventsById = await prisma.events.findUnique({
      where: {
        id: params?.id,
      },
    });

    if (!findEventsById) throw new AppError(404, `id not found`);

    const updateEvents = await prisma.events.update({
      where: {
        id: params?.id,
      },
      data: {
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
