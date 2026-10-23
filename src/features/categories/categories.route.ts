import { Router } from "express";
import { CategoriesController } from "./categories.controller";

export const CategoriesRoute = Router();

CategoriesRoute.post('/', CategoriesController.createCategory)
CategoriesRoute.get('/', CategoriesController.getCategory)
CategoriesRoute.get('/tree', CategoriesController.getCategoryTree)
CategoriesRoute.delete('/:id', CategoriesController.deletedCategory)
CategoriesRoute.put('/:id', CategoriesController.updateCategory)
