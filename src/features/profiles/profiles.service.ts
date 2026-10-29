
import { prisma } from '../../config/prisma-client.config';
import { AppError } from '../../errors/app.error';
import { cloudinaryUpload } from '../../lib/claudinary.lib';
import {
  UpdateCustomerProfileInput,
  PatchCustomerProfileInput,
} from '../../validators/profiles.validator';

export class ProfilesService {
  // FEATURE 2 - NOMOR 2: Isi dan edit profil Customer
  static async updateCustomerProfile(
    userId: string,
    { body }: UpdateCustomerProfileInput,
  ) {
    const findUser = await prisma.users.findFirst({
      where: {
        id: userId,
        role: 'CUSTOMER',
        deletedAt: null,
      },
    });

    if (!findUser) {
      throw new AppError(404, 'Customer not found');
    }

    const updatedProfile = await prisma.customerProfiles.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        fullname: body.fullname,
        phoneNumber: body.phoneNumber,
        dateOfBirth: body.dateOfBirth
          ? new Date(body.dateOfBirth)
          : null,
        avatarUrl: '',
      },
      update: {
        fullname: body.fullname,
        phoneNumber: body.phoneNumber,
        dateOfBirth: body.dateOfBirth
          ? new Date(body.dateOfBirth)
          : undefined,
      },
    });

    return { updatedProfile };
  }

  // FEATURE 2 - NOMOR 2: Edit sebagian data profil Customer
  static async patchCustomerProfile(
    userId: string,
    { body }: PatchCustomerProfileInput,
  ) {
    // 1. Cari profil Customer yang sedang login
    const findProfile = await prisma.customerProfiles.findFirst({
      where: {
        userId,
        deletedAt: null,
        users: {
          role: 'CUSTOMER',
          deletedAt: null,
        },
      },
    });

    if (!findProfile) {
      throw new AppError(404, 'Customer profile not found');
    }

    // 2. Update hanya properti yang dikirim
    const updatedProfile = await prisma.customerProfiles.update({
      where: {
        id: findProfile.id,
      },
      data: {
        fullname: body.fullname,
        phoneNumber: body.phoneNumber,
        dateOfBirth: body.dateOfBirth
          ? new Date(body.dateOfBirth)
          : undefined,
      },
    });

    return { updatedProfile };
  }

  // FEATURE 2 - NOMOR 2: Upload dan edit foto profil Customer
  static async updateCustomerAvatar(
    userId: string,
    file: Express.Multer.File,
  ) {
    // 1. Pastikan Customer dan profilnya tersedia
    const findProfile = await prisma.customerProfiles.findFirst({
      where: {
        userId,
        deletedAt: null,
        users: {
          role: 'CUSTOMER',
          deletedAt: null,
        },
      },
    });

    if (!findProfile) {
      throw new AppError(404, 'Customer profile not found');
    }

    // 2. Upload foto ke Cloudinary
    const avatarUrl = (await cloudinaryUpload(file.buffer)) as string;

    // 3. Simpan URL foto ke database
    const updatedProfile = await prisma.customerProfiles.update({
      where: {
        id: findProfile.id,
      },
      data: {
        avatarUrl,
      },
    });

    return { updatedProfile };
  }

  // FEATURE 2 - NOMOR 2: Ambil profil Customer
  static async getCustomerProfile(userId: string) {
    const customerProfile = await prisma.customerProfiles.findUnique({
      where: {
        userId,
      },
    });

    if (!customerProfile) {
      throw new AppError(404, 'Customer profile not found');
    }

    return { customerProfile };
  }
}
