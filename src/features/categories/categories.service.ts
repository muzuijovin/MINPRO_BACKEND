import { prisma } from "../../config/prisma-cllient.config";
import { Prisma } from "../../generated/prisma/client";
import { CategoriesGetSchema } from "../../validatiors/categories.validators";

export class CategoriesService {
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
}
