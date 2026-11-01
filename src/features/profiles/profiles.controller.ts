import { Request, Response } from 'express';
import {
  updateCustomerProfileSchema,
  patchCustomerProfileSchema,
  updateOrganizerProfileSchema,
  patchOrganizerProfileSchema,
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

  // FEATURE 2 - NOMOR 2: Mengambil profil EO
  static async getOrganizerProfile(req: Request, res: Response) {
    // Ambil ID EO dari JWT yang sudah diverifikasi
    const { id } = res.locals.payload;

    // Panggil Service untuk mengambil profil EO
    const { organizerProfile } = await ProfilesService.getOrganizerProfile(id);

    res.status(200).json({
      success: true,
      message: 'Organizer profile retrieved successfully',
      data: organizerProfile,
    });
  }

  // FEATURE 2 - NOMOR 2: Isi dan edit profil EO
  static async updateOrganizerProfile(req: Request, res: Response) {
    // Ambil ID EO dari JWT
    const { id } = res.locals.payload;

    // Validasi body menggunakan Zod
    const { body } = validate(updateOrganizerProfileSchema, {
      body: req.body,
    });

    // Panggil Service untuk memperbarui profil EO
    const { updatedProfile } = await ProfilesService.updateOrganizerProfile(
      id,
      { body },
    );

    res.status(200).json({
      success: true,
      message: 'Organizer profile updated successfully',
      data: updatedProfile,
    });
  }

  // FEATURE 2 - NOMOR 2: Edit sebagian profil EO
  static async patchOrganizerProfile(req: Request, res: Response) {
    const { id } = res.locals.payload;

    const { body } = validate(patchOrganizerProfileSchema, {
      body: req.body,
    });

    const { updatedProfile } = await ProfilesService.patchOrganizerProfile(id, {
      body,
    });

    res.status(200).json({
      success: true,
      message: 'Organizer profile partially updated successfully',
      data: updatedProfile,
    });
  }

  // FEATURE 2 - NOMOR 2: Upload dan edit logo profil EO
  static async updateOrganizerLogo(req: Request, res: Response) {
    // Ambil ID EO dari JWT
    const { id } = res.locals.payload;

    // Ambil file logo dari Multer
    const file = req.file;

    // Pastikan EO mengirimkan logo
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Logo file is required',
      });
    }

    // Panggil Service untuk upload ke Cloudinary
    const { updatedProfile } = await ProfilesService.updateOrganizerLogo(
      id,
      file,
    );

    res.status(200).json({
      success: true,
      message: 'Organizer logo updated successfully',
      data: updatedProfile,
    });
  }
}
