import { prisma } from '../../config/prisma-cllient.config';
import { AppError } from '../../errors/app.error';
import { UpdateCustomerProfileInput } from '../../validators/profiles.validator';

export class ProfilesService {
  static async updateCustomerProfile(
    userId: string,
    { body }: UpdateCustomerProfileInput,
  ) {
    const findCustomerProfile = await prisma.customerProfiles.findFirst({
      where: {
        userId,
        deletedAt: null,
        users: {
          role: 'CUSTOMER',
          deletedAt: null,
        },
      },
    });

    if (!findCustomerProfile)
      throw new AppError(404, 'Customer profile not found');

    const updatedProfile = await prisma.customerProfiles.update({
      where: {
        id: findCustomerProfile.id,
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
}