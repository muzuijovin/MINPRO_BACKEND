import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app.error";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { MulterError } from "multer";

export const errorMiddleware = (
  error: unknown,
  _: Request,
  res: Response,
  __: NextFunction,
) => {
  console.log(error);

  // APPLICATION ERROR
  if (error instanceof AppError) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
      data: {},
    });
  }

  if (error instanceof MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: `File size exceeds the maximum limit of 5 MB`,
        data: {},
      });
    }
  }

  // JWT ERROR: token tidak valid atau kedaluwarsa
  if (error instanceof JsonWebTokenError) {
    return res.status(401).json({
      success: false,
      message:
        error.name === "TokenExpiredError"
          ? "Access token has expired"
          : "Invalid token",
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
