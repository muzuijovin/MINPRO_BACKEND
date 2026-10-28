import { prisma } from "../../config/prisma-cllient.config";
import { AppError } from "../../errors/app.error";
import {
  BankAccountsCreateSchema,
  BankAccountsGetByEventSchema,
  BankAccountsUpdatedSchema,
} from "../../validatiors/bankAccounts.validator";

export class BankAccountsServices {
  static async createBankAccount({ body }: BankAccountsCreateSchema, userId: string) {
    const findOrganizer = await this.findOrganizerByUserId(userId);

    return await prisma.organizerBankAccounts.create({
      data: {
        organizerId: findOrganizer.id,
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        accountHolder: body.accountHolder,
        isActive: body.isActive,
      },
    });
  }

  // semua rekening milik EO yang login (aktif & nonaktif), untuk halaman dashboard EO
  static async getMyBankAccounts(userId: string) {
    const findOrganizer = await this.findOrganizerByUserId(userId);

    return await prisma.organizerBankAccounts.findMany({
      where: {
        organizerId: findOrganizer.id,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // rekening aktif dari EO pemilik event, ditampilkan ke customer saat checkout
  static async getBankAccountsByEvent({ params }: BankAccountsGetByEventSchema) {
    const findEventById = await prisma.events.findFirst({
      where: {
        id: params.eventId,
        deletedAt: null,
      },
    });

    if (!findEventById) throw new AppError(404, "Event not found");

    return await prisma.organizerBankAccounts.findMany({
      where: {
        organizerId: findEventById.organizerId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        bankName: true,
        accountNumber: true,
        accountHolder: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async updateBankAccount({ params, body }: BankAccountsUpdatedSchema, userId: string) {
    const findOrganizer = await this.findOrganizerByUserId(userId);

    const findBankAccountById = await prisma.organizerBankAccounts.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
      },
    });

    if (!findBankAccountById) throw new AppError(404, "Bank account not found");

    // EO cuma boleh ubah rekening miliknya sendiri
    if (findBankAccountById.organizerId !== findOrganizer.id)
      throw new AppError(403, "You are not the owner of this bank account");

    return await prisma.organizerBankAccounts.update({
      where: { id: params.id },
      data: body,
    });
  }

  private static async findOrganizerByUserId(userId: string) {
    const findOrganizer = await prisma.organizerProfiles.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!findOrganizer) throw new AppError(404, "Organizer profile not found");

    return findOrganizer;
  }
}
