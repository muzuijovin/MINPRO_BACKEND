import { Jwt } from '../lib/jwt.lib';
import { AppError } from '../errors/app.error';
import { NextFunction, Request, Response } from 'express';
import 'dotenv/config';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log('AUTHENTICATE MIDDLEWARE HIT');

  try {
    const token = req.cookies?.token;

    console.log('TOKEN:', token ? 'ADA' : 'TIDAK ADA');

    if (!token) {
      throw new AppError(401, 'Token must be provided');
    }

    const payload = await Jwt.verify(token, process.env.JWT_SECRET_KEY!);

    res.locals.payload = payload;

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const payload = res.locals.payload;

    if (!allowedRoles.includes(payload?.role)) {
      return next(new AppError(403, 'Unauthorized user role'));
    }

    next();
  };
};
