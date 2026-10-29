import { Request, Response } from 'express';
import { updateCustomerProfileSchema } from '../../validators/profiles.validator';
import { validate } from '../../validators/validate';
import { ProfilesService } from './profiles.service';

export class ProfilesController {
  static async updateCustomerProfile(req: Request, res: Response) {
    // Ambil ID Customer dari JWT yang sudah diverifikasi
    const { id } = res.locals.payload;

    // Validasi body menggunakan Zod
    const { body } = validate(updateCustomerProfileSchema, {
      body: req.body,
    });

    // Panggil Service untuk memperbarui profil
    const { updatedProfile } = await ProfilesService.updateCustomerProfile(
      id,
      { body },
    );

    res.status(200).json({
      success: true,
      message: 'Customer profile updated successfully',
      data: updatedProfile,
    });
  }
}