import { prisma } from "../../config/prisma-cllient.config";
import { AppError } from "../../errors/app.error";
import { generateSlug } from "../../utlis/slug";
import {
  CategoriesCreateSchema,
  CategoriesDeletedSchema,
  CategoriesGetSchema,
  CategoriesupdatedSchema,
} from "../../validatiors/categories.validators";

export class CategoriesService {
  static async createCategory({ body }: CategoriesCreateSchema) {
    // validasi id, kalau ada throw error
    const findCategoryById = await prisma.categories.findUnique({
      where: {
        id: body?.id,
      },
    });

    if (findCategoryById)
      throw new AppError(409, `id = ${body?.id} is already exists`);

    // Generate slug otomatis berdasarkan title
    const slug = await this.generateUniqueSlug(body.name);

    const createCategory = await prisma.categories.create({
      data: {
        id: body?.id,
        slug,
        name: body?.name,
        parentId: body?.parentId,
      },
    });

    return { createCategory };
  }

  static async getCategory({ query }: CategoriesGetSchema) {
    const offset = (query?.page - 1) * query?.limit;

    const categories = await prisma.events.findMany({
      where: {
        deletedAt: null,
      },
      take: query?.limit,
      skip: offset,
      orderBy: {
        createdAt: "asc",
      },
    });

    const totalCategories = await prisma.events.count({
      where: {
        deletedAt: null,
      },
    });

    const totalPage = Math.ceil(totalCategories / query.limit);

    return {
      page: query?.page,
      totalPage,
      limit: query?.limit,
      categories,
      totalCategories,
    };
  }

  static async deletedCategory({ params }: CategoriesDeletedSchema) {
    // validasi apakah id nya ada/sesuai, kalau tidak throw apperror

    const findCategoryById = await prisma.categories.findUnique({
      where: {
        id: params?.id,
      },
    });

    if (!findCategoryById) throw new AppError(404, "id was not found");

    const deletedCategory = await prisma.categories.update({
      data: {
        deletedAt: new Date(),
      },
      where: {
        id: params?.id,
      },
    });

    return {deletedCategory}
  }

  static async updateCategory ({params, body} : CategoriesupdatedSchema){
    // validasi apakah id nya ada/sesuai, kalau tidak throw apperror
    const findCategoryById = await prisma.categories.findUnique({
      where:{
        id: params?.id
      }
    })

    if (!findCategoryById)
      throw new AppError(404, 'email was not found')

    const updatedCategory = await prisma.categories.update({
      where:{
        id: params?.id
      },
      data: {
        name: body?.name
      }
    })

    return {updatedCategory}
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
