import { registerUserSchema } from '../../validators/users.validators';
import { Request, Response, NextFunction } from 'express';
import { AuthServices } from './auth.service';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('REGISTER CONTROLLER HIT');

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

  // READ: mengambil semua data user
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await AuthServices.getUsers();

      res.status(200).json({
        message: 'Users retrieved successfully',
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }
}
