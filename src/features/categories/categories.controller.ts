import { Request, Response } from "express";
import { validate } from "../../validatiors/validate";
import {
  categoriesCreateSchema,
  categoriesDeletedSchema,
  categoriesGetSchema,
  categoriesupdatedSchema,
} from "../../validatiors/categories.validators";
import { CategoriesService } from "./categories.service";

export class CategoriesController {
  static async createCategory(req: Request, res: Response) {
    const { body } = validate(categoriesCreateSchema, { body: req?.body });

    const { createCategory } = await CategoriesService.createCategory({ body });

    res.status(201).json({
      success: true,
      message: "category created successfully",
      data: createCategory,
    });
  }

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

  static async deletedCategory(req: Request, res: Response) {
    const { params } = validate(categoriesDeletedSchema, {
      params: req?.params,
    });

    const { deletedCategory } = await CategoriesService.deletedCategory({
      params,
    });

    res.status(200).json({
      success: true,
      message: "category deleted successfully",
      data: deletedCategory,
    });
  }

  static async updateCategory(req: Request, res: Response) {
    // params & body divalidasi sekaligus karena schema nya mewajibkan keduanya
    const { params, body } = validate(categoriesupdatedSchema, {
      params: req?.params,
      body: req?.body,
    });

    const {updatedCategory} = await CategoriesService.updateCategory({params, body})

    res.status(200).json({
      success: true,
      message: "category updated successfully",
      data: updatedCategory,
    });
  }
}
