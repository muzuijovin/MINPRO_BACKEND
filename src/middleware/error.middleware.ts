
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app.error";

export const errorMiddleware = (
  error: unknown,
  _: Request,
  res: Response,
  __: NextFunction,
) => {
  console.log(error);

  // VALIDATION ERROR: Zod
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
      data: {},
    });
  }

  // APPLICATION ERROR
  if (error instanceof AppError) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
      data: {},
    });
  }

  // INTERNAL SERVER ERROR
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    data: {},
  });
};
