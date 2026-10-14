import { NextFunction, Request, Response } from "express";

export const errorMiddleware = (
  error: unknown,
  _: Request,
  res: Response,
  __: NextFunction
) => {
  if (error instanceof Error) {
        return res.status(500).json({
          success: false,
          message: error.message,
          data: [],
        });
      }
}