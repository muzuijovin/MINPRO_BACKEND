import { prisma } from '../../config/prisma-client.config';
import { AppError } from '../../errors/app.error';
import {
  CreateOrganizerBankAccountInput,
  PatchOrganizerBankAccountInput,
} from '../../validators/organizer-bank-accounts.validator';

export class OrganizerBankAccountsService {
  // FEATURE 2 - NOMOR 2: Tambah rekening bank EO
  static async createOrganizerBankAccount(
    userId: string,
    { body }: CreateOrganizerBankAccountInput,
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

    // 2. Tambahkan rekening bank milik EO
    const createdBankAccount = await prisma.organizerBankAccounts.create({
      data: {
        organizerId: findProfile.id,
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        accountHolder: body.accountHolder,
      },
    });

    const {
      id,
      organizerId,
      accountNumber,
      ...bankAccountWithoutSensitiveData
    } = createdBankAccount;
    return bankAccountWithoutSensitiveData;
  }

  // FEATURE 2 - NOMOR 2: Ambil daftar rekening bank EO
  static async getOrganizerBankAccounts(userId: string) {
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

    // 2. Ambil rekening yang belum dihapus
    const bankAccounts = await prisma.organizerBankAccounts.findMany({
      where: {
        organizerId: findProfile.id,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const safeBankAccounts = bankAccounts.map(
      ({ id, organizerId, accountNumber, ...safeBankAccount }) =>
        safeBankAccount,
    );

    return safeBankAccounts;
  }

  // FEATURE 2 - NOMOR 2: Edit sebagian rekening bank EO
  static async patchOrganizerBankAccount(
    userId: string,
    bankAccountId: string,
    { body }: PatchOrganizerBankAccountInput,
  ) {
    // 1. Cari rekening milik EO yang sedang login
    const findBankAccount = await prisma.organizerBankAccounts.findFirst({
      where: {
        id: bankAccountId,
        deletedAt: null,
        organizer: {
          userId,
          deletedAt: null,
          users: {
            role: 'EO',
            deletedAt: null,
          },
        },
      },
    });

    if (!findBankAccount) {
      throw new AppError(404, 'Organizer bank account not found');
    }

    // 2. Update hanya properti yang dikirim
    const updatedBankAccount = await prisma.organizerBankAccounts.update({
      where: {
        id: findBankAccount.id,
      },
      data: {
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        accountHolder: body.accountHolder,
        isActive: body.isActive,
      },
    });
    const { id, organizerId, accountNumber, ...safeBankAccount } =
      updatedBankAccount;

    return { safeBankAccount };
  }

  // FEATURE 2 - NOMOR 2: Hapus rekening bank EO (soft delete)
  static async deleteOrganizerBankAccount(
    userId: string,
    bankAccountId: string,
  ) {
    // 1. Cari rekening milik EO yang sedang login
    const findBankAccount = await prisma.organizerBankAccounts.findFirst({
      where: {
        id: bankAccountId,
        deletedAt: null,
        organizer: {
          userId,
          deletedAt: null,
          users: {
            role: 'EO',
            deletedAt: null,
          },
        },
      },
    });

    if (!findBankAccount) {
      throw new AppError(404, 'Organizer bank account not found');
    }

    // 2. Tandai rekening sebagai dihapus
    const deletedBankAccount = await prisma.organizerBankAccounts.update({
      where: {
        id: findBankAccount.id,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
    const { id, organizerId, accountNumber, ...safeBankAccount } =
      deletedBankAccount;

    return { safeBankAccount };
  }
}
