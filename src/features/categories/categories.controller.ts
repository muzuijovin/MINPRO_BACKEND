import { Request, Response } from "express";
import { categoriesGetSchema } from "../../validatiors/categories.validators";
import { CategoriesService } from "./categories.service";
import { validate } from "../../validators/validate";

export class CategoriesController {
  static async getCategory(req: Request, res: Response) {
    const { query } = validate(categoriesGetSchema, { query: req?.query });

    const { page, totalPage, limit, categories, totalCategories } =
      await CategoriesService.getCategory({ query });

    res.status(200).json({
      success: true,
      message: "category get successfully",
      data: categories,
      meta: {
        page,
        totalPage,
        limit,
        totalCategories,
      },
    });
  }

  static async getCategoryTree(req: Request, res: Response) {
    const { tree } = await CategoriesService.getCategoryTree();

    res.status(200).json({
      success: true,
      message: "category tree get successfully",
      data: tree,
    });
  }
}
