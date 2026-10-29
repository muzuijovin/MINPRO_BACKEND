import { Request, Response } from 'express';
import {
  updateCustomerProfileSchema,
  patchCustomerProfileSchema,
} from '../../validators/profiles.validator';
import { validate } from '../../validators/validate';
import { ProfilesService } from './profiles.service';

export class ProfilesController {
  // FEATURE 2 - NOMOR 2: Isi dan edit profil Customer
  static async updateCustomerProfile(req: Request, res: Response) {
    // Ambil ID Customer dari JWT yang sudah diverifikasi
    const { id } = res.locals.payload;

    // Validasi body menggunakan Zod
    const { body } = validate(updateCustomerProfileSchema, {
      body: req.body,
    });

    // Panggil Service untuk memperbarui profil
    const { updatedProfile } = await ProfilesService.updateCustomerProfile(id, {
      body,
    });

    res.status(200).json({
      success: true,
      message: 'Customer profile updated successfully',
      data: updatedProfile,
    });
  }

  // FEATURE 2 - NOMOR 2: Upload dan edit foto profil Customer
  static async updateCustomerAvatar(req: Request, res: Response) {
    // Ambil ID Customer dari JWT
    const { id } = res.locals.payload;

    // Ambil file foto dari Multer
    const file = req.file;

    // Pastikan Customer mengirimkan foto
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Avatar file is required',
      });
    }

    // Panggil Service untuk upload ke Cloudinary
    const { updatedProfile } = await ProfilesService.updateCustomerAvatar(
      id,
      file,
    );

    res.status(200).json({
      success: true,
      message: 'Customer avatar updated successfully',
      data: updatedProfile,
    });
  }

  // FEATURE 2 - NOMOR 2: Mengambil profil Customer
  static async getCustomerProfile(req: Request, res: Response) {
    // Ambil ID Customer dari JWT yang sudah diverifikasi
    const { id } = res.locals.payload;

    // Panggil Service untuk mengambil profil Customer
    const { customerProfile } = await ProfilesService.getCustomerProfile(id);

    res.status(200).json({
      success: true,
      message: 'Customer profile retrieved successfully',
      data: customerProfile,
    });
  }

  // FEATURE 2 - NOMOR 2: Edit sebagian profil Customer
  static async patchCustomerProfile(req: Request, res: Response) {
    const { id } = res.locals.payload;

    const { body } = validate(patchCustomerProfileSchema, {
      body: req.body,
    });

    const { updatedProfile } = await ProfilesService.patchCustomerProfile(id, {
      body,
    });

    res.status(200).json({
      success: true,
      message: 'Customer profile partially updated successfully',
      data: updatedProfile,
    });
  }
}
