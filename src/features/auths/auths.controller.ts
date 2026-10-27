import {
  registerUserSchema,
  loginUserSchema,
  setPasswordUserSchema,
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

  static async logout(req: Request, res: Response) {
    // opsi harus sama dengan waktu cookie dibuat di login, kalau beda browser tidak menghapusnya
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      data: {},
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

  static async setPassword(req: Request, res: Response) {
    const { body, params } = validate(setPasswordUserSchema, {
      body: req.body,
      params: req.params,
    });

    const { safeUser } = await AuthsService.setPassword({ body, params });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: safeUser,
    });
  }
}
