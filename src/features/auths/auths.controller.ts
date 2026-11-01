import {
  registerUserSchema,
  loginUserSchema,
  changePasswordUserSchema,
  forgotPasswordUserSchema,
  resetPasswordUserSchema,
} from '../../validators/auths.validator';
import { Request, Response } from 'express';
import { validate } from '../../validators/validate';
import { AuthsService } from './auths.service';

export class AuthController {
  static async registerForCustomer(req: Request, res: Response) {
    const { body } = validate(registerUserSchema, { body: req.body });

    const userWithoutPassword = await AuthsService.registerForCustomer({
      body,
    });

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: userWithoutPassword,
    });
  }

  static async registerForEo(req: Request, res: Response) {
    const { body } = validate(registerUserSchema, { body: req?.body });

    const userWithoutPassword = await AuthsService.registerForEo({ body });
    res.status(201).json({
      success: true,
      message: 'EO registered successfully',
      data: userWithoutPassword,
    });
  }

  static async login(req: Request, res: Response) {
    const { body } = validate(loginUserSchema, { body: req.body });

    const { token, userWithoutPassword } = await AuthsService.login({ body });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });

    res.status(200).json({
      success: true,
      message:
        userWithoutPassword.role === 'CUSTOMER'
          ? 'Customer logged in successfully'
          : 'EO logged in successfully',
      data: userWithoutPassword,
    });
  }

  static async me(req: Request, res: Response) {
    const { payload } = res?.locals;

    const user = await AuthsService.me(payload?.id);

    res.status(200).json({
      success: true,
      message: 'Session login valid',
      data: user,
    });
  }

  // FEATURE 2 - NOMOR 2: Change Password Customer dan EO
  static async changePassword(req: Request, res: Response) {
    const { body } = validate(changePasswordUserSchema, {
      body: req.body,
    });

    const { payload } = res.locals;

    await AuthsService.changePassword({
      userId: payload.id,
      body,
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: {},
    });
  }

    // FEATURE 2 - NOMOR 2: Forgot Password Customer dan EO
  static async forgotPassword(req: Request, res: Response) {
    const { body } = validate(forgotPasswordUserSchema, {
      body: req.body,
    });

    await AuthsService.forgotPassword({ body });

    res.status(200).json({
      success: true,
      message: 'If the email is registered, a password reset link will be sent',
      data: {},
    });
  }

    // FEATURE 2 - NOMOR 2: Reset Password Customer dan EO
  static async resetPassword(req: Request, res: Response) {
    const { body } = validate(resetPasswordUserSchema, {
      body: req.body,
    });

    await AuthsService.resetPassword({ body });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {},
    });
  }
}
