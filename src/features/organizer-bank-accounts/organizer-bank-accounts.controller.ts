
import { Request, Response } from 'express';
import {
  createOrganizerBankAccountSchema,
  patchOrganizerBankAccountSchema,
} from '../../validators/organizer-bank-accounts.validator';
import { validate } from '../../validators/validate';
import { OrganizerBankAccountsService } from './organizer-bank-accounts.service';

export class OrganizerBankAccountsController {
  // FEATURE 2 - NOMOR 2: Tambah rekening bank EO
  static async createOrganizerBankAccount(req: Request, res: Response) {
    // Ambil ID EO dari JWT yang sudah diverifikasi
    const { id } = res.locals.payload;

    // Validasi body menggunakan Zod
    const { body } = validate(createOrganizerBankAccountSchema, {
      body: req.body,
    });

    // Panggil Service untuk menambahkan rekening
    const createdBankAccount  =
      await OrganizerBankAccountsService.createOrganizerBankAccount(id, {
        body,
      });

    res.status(201).json({
      success: true,
      message: 'Organizer bank account created successfully',
      data: createdBankAccount,
    });
  }

  // FEATURE 2 - NOMOR 2: Ambil daftar rekening bank EO
  static async getOrganizerBankAccounts(req: Request, res: Response) {
    // Ambil ID EO dari JWT yang sudah diverifikasi
    const { id } = res.locals.payload;

    // Panggil Service untuk mengambil daftar rekening
    const bankAccounts =
      await OrganizerBankAccountsService.getOrganizerBankAccounts(id);

    res.status(200).json({
      success: true,
      message: 'Organizer bank accounts retrieved successfully',
      data: bankAccounts,
    });
  }

  // FEATURE 2 - NOMOR 2: Edit sebagian rekening bank EO
  static async patchOrganizerBankAccount(req: Request, res: Response) {
    // Ambil ID EO dari JWT
    const { id } = res.locals.payload;

    // Ambil ID rekening dari URL
    const bankAccountId = req.params.id as string;

    // Validasi body menggunakan Zod
    const { body } = validate(patchOrganizerBankAccountSchema, {
      body: req.body,
    });

    // Panggil Service untuk memperbarui rekening
    const updatedBankAccount  =
      await OrganizerBankAccountsService.patchOrganizerBankAccount(
        id,
        bankAccountId,
        { body },
      );

    res.status(200).json({
      success: true,
      message: 'Organizer bank account updated successfully',
      data: updatedBankAccount,
    });
  }

  // FEATURE 2 - NOMOR 2: Hapus rekening bank EO
  static async deleteOrganizerBankAccount(req: Request, res: Response) {
    // Ambil ID EO dari JWT
    const { id } = res.locals.payload;

    // Ambil ID rekening dari URL
    const bankAccountId = req.params.id as string;

    // Panggil Service untuk soft delete rekening
    const  deletedBankAccount  =
      await OrganizerBankAccountsService.deleteOrganizerBankAccount(
        id,
        bankAccountId,
      );

    res.status(200).json({
      success: true,
      message: 'Organizer bank account deleted successfully',
      data: deletedBankAccount,
    });
  }
}
