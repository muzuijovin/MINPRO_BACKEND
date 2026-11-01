
import { Router } from 'express';
import { OrganizerBankAccountsController } from './organizer-bank-accounts.controller';
import { authenticate, authorize } from '../../middleware/auths.middleware';

export const OrganizerBankAccountsRoute = Router();

// FEATURE 2 - NOMOR 2: Mengambil daftar rekening bank EO
OrganizerBankAccountsRoute.get(
  '/',
  authenticate,
  authorize(['EO']),
  OrganizerBankAccountsController.getOrganizerBankAccounts,
);

// FEATURE 2 - NOMOR 2: Menambahkan rekening bank EO
OrganizerBankAccountsRoute.post(
  '/',
  authenticate,
  authorize(['EO']),
  OrganizerBankAccountsController.createOrganizerBankAccount,
);

// FEATURE 2 - NOMOR 2: Edit sebagian rekening bank EO
OrganizerBankAccountsRoute.patch(
  '/:id',
  authenticate,
  authorize(['EO']),
  OrganizerBankAccountsController.patchOrganizerBankAccount,
);

// FEATURE 2 - NOMOR 2: Hapus rekening bank EO
OrganizerBankAccountsRoute.delete(
  '/:id',
  authenticate,
  authorize(['EO']),
  OrganizerBankAccountsController.deleteOrganizerBankAccount,
);
