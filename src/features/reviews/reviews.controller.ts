import { Request, Response } from "express";
import { validate } from "../../validators/validate";
import { reviewsCreateSchema, reviewsGetSchema } from "../../validatiors/reviews.validator";
import { ReviewsServices } from "./reviews.services";

export class ReviewsController {
  static async createReview(req: Request, res: Response) {
    const { body } = validate(reviewsCreateSchema, { body: req?.body });

    // id user yang login, diisi authenticate middleware dari token
    const { payload } = res.locals;

    const create = await ReviewsServices.createReview({ body }, payload?.id);

    res.status(201).json({
      success: true,
      message: "create review successfully",
      data: create,
    });
  }

  static async getReviews(req: Request, res: Response) {
    const { query } = validate(reviewsGetSchema, { query: req?.query });

    const { page, totalPage, limit, reviews, totalReviews, averageRating } =
      await ReviewsServices.getReviews({ query });

    res.status(200).json({
      success: true,
      message: "get reviews successfully",
      data: reviews,
      meta: {
        page,
        totalPage,
        limit,
        totalReviews,
        averageRating,
      },
    });
  }
}
