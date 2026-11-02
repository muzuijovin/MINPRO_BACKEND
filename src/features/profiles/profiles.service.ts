import { prisma } from '../../config/prisma-client.config';
import { AppError } from '../../errors/app.error';
import { cloudinaryUpload } from '../../lib/claudinary.lib';
import {
  UpdateCustomerProfileInput,
  PatchCustomerProfileInput,
  UpdateOrganizerProfileInput,
  PatchOrganizerProfileInput,
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
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        avatarUrl: '',
      },
      update: {
        fullname: body.fullname,
        phoneNumber: body.phoneNumber,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      },
    });

    const { id, userId: profileUserId, ...profileWithoutIds } = updatedProfile;

    return { updatedProfile: profileWithoutIds };
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
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      },
    });

    const { id, userId: profileUserId, ...profileWithoutIds } = updatedProfile;

    return { updatedProfile: profileWithoutIds };
  }

  // FEATURE 2 - NOMOR 2: Upload dan edit foto profil Customer
  static async updateCustomerAvatar(userId: string, file: Express.Multer.File) {
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

    const { id, userId: profileUserId, ...profileWithoutIds } = updatedProfile;

    return { updatedProfile: profileWithoutIds };
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

    const { id, userId: profileUserId, ...profileWithoutIds } = customerProfile;

    return { customerProfile: profileWithoutIds };
  }

  // FEATURE 2 - NOMOR 2: Ambil profil EO
  static async getOrganizerProfile(userId: string) {
    // 1. Cari profil EO yang sedang login
    const organizerProfile = await prisma.organizerProfiles.findFirst({
      where: {
        userId,
        deletedAt: null,
        users: {
          role: 'EO',
          deletedAt: null,
        },
      },
      include: {
        users: {
          select: {
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!organizerProfile) {
      throw new AppError(404, 'Organizer profile not found');
    }

    const {
      id,
      userId: profileUserId,
      users,
      ...profileWithoutIds
    } = organizerProfile;

    return {
      organizerProfile: {
        ...profileWithoutIds,
        username: users.username,
        email: users.email,
        role: users.role,
      },
    };
  }

  // FEATURE 2 - NOMOR 2: Isi dan edit profil EO
  static async updateOrganizerProfile(
    userId: string,
    { body }: UpdateOrganizerProfileInput,
  ) {
    // 1. Pastikan akun yang login adalah EO
    const findUser = await prisma.users.findFirst({
      where: {
        id: userId,
        role: 'EO',
        deletedAt: null,
      },
    });

    if (!findUser) {
      throw new AppError(404, 'Organizer not found');
    }

    // 2. Cari profil EO yang sudah tersedia
    const findProfile = await prisma.organizerProfiles.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    // 3. NIK dan NIB tidak boleh diubah setelah profil dibuat
    if (
      findProfile &&
      (findProfile.nik !== body.nik || findProfile.nib !== body.nib)
    ) {
      throw new AppError(400, 'NIK and NIB cannot be changed');
    }

    // 4. Buat profil baru atau perbarui profil yang sudah ada
    const updatedProfile = await prisma.organizerProfiles.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        organizationName: body.organizationName,
        fullName: body.fullName,
        nik: body.nik,
        nib: body.nib,
        npwp: body.npwp || null,
        phoneNumber: body.phoneNumber,
        businessAddress: body.businessAddress,
        logoUrl: '',
      },
      update: {
        organizationName: body.organizationName,
        fullName: body.fullName,
        npwp: body.npwp,
        phoneNumber: body.phoneNumber,
        businessAddress: body.businessAddress,
      },
    });

    const { id, userId: profileUserId, ...profileWithoutIds } = updatedProfile;

    return { updatedProfile: profileWithoutIds };
  }

  // FEATURE 2 - NOMOR 2: Edit sebagian data profil EO
  static async patchOrganizerProfile(
    userId: string,
    { body }: PatchOrganizerProfileInput,
  ) {
    // 1. Cari profil EO yang sedang login
    const findProfile = await prisma.organizerProfiles.findFirst({
      where: {
        userId,
        deletedAt: null,
        users: {
          role: 'EO',
          deletedAt: null,
        },
      },
    });

    if (!findProfile) {
      throw new AppError(404, 'Organizer profile not found');
    }

    // 2. Update hanya properti yang dikirim
    const updatedProfile = await prisma.organizerProfiles.update({
      where: {
        id: findProfile.id,
      },
      data: {
        organizationName: body.organizationName,
        fullName: body.fullName,
        npwp: body.npwp,
        phoneNumber: body.phoneNumber,
        businessAddress: body.businessAddress,
      },
    });

    const { id, userId: profileUserId, ...profileWithoutIds } = updatedProfile;

    return { updatedProfile: profileWithoutIds };
  }

  // FEATURE 2 - NOMOR 2: Upload dan edit logo profil EO
  static async updateOrganizerLogo(userId: string, file: Express.Multer.File) {
    // 1. Pastikan EO dan profilnya tersedia
    const findProfile = await prisma.organizerProfiles.findFirst({
      where: {
        userId,
        deletedAt: null,
        users: {
          role: 'EO',
          deletedAt: null,
        },
      },
    });

    if (!findProfile) {
      throw new AppError(404, 'Organizer profile not found');
    }

    // 2. Upload logo ke Cloudinary
    const logoUrl = (await cloudinaryUpload(file.buffer)) as string;

    // 3. Simpan URL logo ke database
    const updatedProfile = await prisma.organizerProfiles.update({
      where: {
        id: findProfile.id,
      },
      data: {
        logoUrl,
      },
    });

    const { id, userId: profileUserId, ...profileWithoutIds } = updatedProfile;

    return { updatedProfile: profileWithoutIds };
  }
}
