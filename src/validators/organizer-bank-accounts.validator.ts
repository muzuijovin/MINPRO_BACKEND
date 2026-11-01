
import * as z from 'zod';

// FEATURE 2 - NOMOR 2: Validasi tambah rekening bank EO (POST)
export const createOrganizerBankAccountSchema = z.object({
  body: z.object({
    bankName: z.string().trim().min(1, 'Bank name is required'),
    accountNumber: z.string().trim().min(1, 'Account number is required'),
    accountHolder: z.string().trim().min(1, 'Account holder is required'),
  }),
});

export type CreateOrganizerBankAccountInput = z.infer<
  typeof createOrganizerBankAccountSchema
>;

// FEATURE 2 - NOMOR 2: Validasi edit sebagian rekening bank EO (PATCH)
export const patchOrganizerBankAccountSchema = z.object({
  body: z
    .object({
      bankName: z.string().trim().min(1).optional(),
      accountNumber: z.string().trim().min(1).optional(),
      accountHolder: z.string().trim().min(1).optional(),
      isActive: z.boolean().optional(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      'At least one field is required',
    ),
});

export type PatchOrganizerBankAccountInput = z.infer<
  typeof patchOrganizerBankAccountSchema
>;
