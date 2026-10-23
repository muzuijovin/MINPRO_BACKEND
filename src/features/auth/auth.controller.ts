
import {
  registerUserSchema,
  loginUserSchema,
} from '../../validators/users.validators';
import { Request, Response, NextFunction } from 'express';
import { AuthServices } from './auth.service';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedBody = registerUserSchema.parse(req.body);

      const user = await AuthServices.register({
        body: validatedBody,
      });

      res.status(201).json({
        message: 'Registration successful',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedBody = loginUserSchema.parse(req.body);

      const result = await AuthServices.login({
        body: validatedBody,
      });

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: 'Login successful',
        data: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  // ME: mengambil data user yang sedang login
  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const { payload } = res.locals;

      const user = await AuthServices.me(payload?.id);

      res.status(200).json({
        success: true,
        message: 'Session login valid',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}


  // // READ: mengambil semua data user
  // static async getUsers(req: Request, res: Response, next: NextFunction) {
  //   try {
  //      console.log("GET USERS CONTROLLER HIT");
  //     const users = await AuthServices.getUsers();

  //     res.status(200).json({
  //       message: 'Users retrieved successfully',
  //       data: users,
  //     });
  //   } catch (error) {
  //     next(error);
  //   }


