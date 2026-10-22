
import { registerUserSchema } from '../../validators/users.validators';
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
        success: true, 
        message: 'Registration successful',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
