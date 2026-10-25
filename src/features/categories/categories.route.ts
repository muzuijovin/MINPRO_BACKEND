import { Router } from "express";
import { CategoriesController } from "./categories.controller";

export const CategoriesRoute = Router();

CategoriesRoute.get('/', CategoriesController.getCategory)
CategoriesRoute.get('/tree', CategoriesController.getCategoryTree)
