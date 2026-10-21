import { prisma } from "../../config/prisma-cllient.config";
import { AppError } from "../../errors/app.error";
import { Prisma } from "../../generated/prisma/client";
import { generateSlug } from "../../utlis/slug";
import {
  CategoriesCreateSchema,
  CategoriesDeletedSchema,
  CategoriesGetSchema,
  CategoriesupdatedSchema,
} from "../../validatiors/categories.validators";

export class CategoriesService {
  static async createCategory({ body }: CategoriesCreateSchema) {
    // validasi nama, kalau sudah ada throw error
    const findCategoryByName = await prisma.categories.findFirst({
      where: {
        name: { equals: body?.name, mode: "insensitive" },
        deletedAt: null,
      },
    });

    if (findCategoryByName)
      throw new AppError(409, `category ${body?.name} is already exists`);

    // kalau ada parentId, pastikan parent category nya ada
    if (body?.parentId) await this.validateParent(body.parentId);

    // Generate slug otomatis berdasarkan name
    const slug = await this.generateUniqueSlug(body.name);

    const createCategory = await prisma.categories.create({
      data: {
        slug,
        name: body?.name,
        parentId: body?.parentId,
      },
    });

    return { createCategory };
  }

  static async getCategory({ query }: CategoriesGetSchema) {
    const offset = (query?.page - 1) * query?.limit;

    const where: Prisma.CategoriesWhereInput = {
      deletedAt: null,
    };

    if (query?.search) {
      where.name = { contains: query.search, mode: "insensitive" };
    }

    if (query?.parentId === "root") where.parentId = null;
    else if (query?.parentId) where.parentId = query.parentId;

    const [categories, totalCategories] = await Promise.all([
      prisma.categories.findMany({
        where,
        take: query?.limit,
        skip: offset,
        include: {
          // jumlah event aktif di tiap category
          _count: {
            select: {
              events: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.categories.count({ where }),
    ]);

    const totalPage = Math.ceil(totalCategories / query.limit);

    return {
      page: query?.page,
      totalPage,
      limit: query?.limit,
      categories,
      totalCategories,
    };
  }

  // semua category dalam bentuk parent -> children, dipakai untuk dropdown filter di FE
  static async getCategoryTree() {
    const categories = await prisma.categories.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const tree = categories
      .filter((category) => !category.parentId)
      .map((parent) => ({
        ...parent,
        children: categories.filter((child) => child.parentId === parent.id),
      }));

    return { tree };
  }

  static async deletedCategory({ params }: CategoriesDeletedSchema) {
    // validasi apakah id nya ada/sesuai, kalau tidak throw apperror
    const findCategoryById = await prisma.categories.findFirst({
      where: {
        id: params?.id,
        deletedAt: null,
      },
    });

    if (!findCategoryById) throw new AppError(404, "category not found");

    // category yang masih dipakai event / masih punya sub category tidak boleh dihapus
    const [totalEvents, totalChildren] = await Promise.all([
      prisma.events.count({
        where: { categoryId: params?.id, deletedAt: null },
      }),
      prisma.categories.count({
        where: { parentId: params?.id, deletedAt: null },
      }),
    ]);

    if (totalEvents > 0)
      throw new AppError(409, "category is still used by events");
    if (totalChildren > 0)
      throw new AppError(409, "category still has sub categories");

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
    const findCategoryById = await prisma.categories.findFirst({
      where:{
        id: params?.id,
        deletedAt: null,
      }
    })

    if (!findCategoryById)
      throw new AppError(404, 'category not found')

    if (body?.name) {
      const findCategoryByName = await prisma.categories.findFirst({
        where: {
          name: { equals: body.name, mode: "insensitive" },
          deletedAt: null,
          NOT: { id: params?.id },
        },
      });

      if (findCategoryByName)
        throw new AppError(409, `category ${body.name} is already exists`);
    }

    if (body?.parentId) {
      if (body.parentId === params?.id)
        throw new AppError(422, "category cannot be its own parent");

      await this.validateParent(body.parentId);
    }

    // slug tidak diubah supaya URL filter yang sudah ada tidak rusak
    const updatedCategory = await prisma.categories.update({
      where:{
        id: params?.id
      },
      data: {
        name: body?.name,
        parentId: body?.parentId,
      }
    })

    return {updatedCategory}
  }

  // parent harus ada & harus parent level atas (maksimal 2 level: parent -> sub category)
  static async validateParent(parentId: string) {
    const findParent = await prisma.categories.findFirst({
      where: {
        id: parentId,
        deletedAt: null,
      },
    });

    if (!findParent) throw new AppError(404, "parent category not found");

    if (findParent.parentId)
      throw new AppError(422, "parent category cannot be a sub category");
  }

  static async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (
      await prisma.categories.findUnique({
        where: { slug },
        select: { id: true },
      })
    ) {
      counter++;

      const suffix = `-${counter}`;
      slug = `${baseSlug.slice(0, 100 - suffix.length)}${suffix}`;
    }

    return slug;
  }
}
