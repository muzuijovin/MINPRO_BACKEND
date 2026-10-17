import { Router } from "express";
import { CategoriesController } from "./categories.controller";

export const CategoriesRoute = Router();

CategoriesRoute.post('/', CategoriesController.createCategory)
CategoriesRoute.get('/', CategoriesController.getCategory)
CategoriesRoute.delete('/:id')
CategoriesRoute.put('/:id')
