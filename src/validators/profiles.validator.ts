
import * as z from 'zod';

// FEATURE 2 - NOMOR 2: Validasi isi dan edit profil Customer (PUT)
export const updateCustomerProfileSchema = z.object({
  body: z.object({
    fullname: z.string().trim().min(1, 'Full name is required'),
    phoneNumber: z.string().trim().min(1, 'Phone number is required'),
    dateOfBirth: z.string().optional(),
  }),
});

// FEATURE 2 - NOMOR 2: Tipe data PUT profil Customer
export type UpdateCustomerProfileInput = z.infer<
  typeof updateCustomerProfileSchema
>;

// FEATURE 2 - NOMOR 2: Validasi edit sebagian profil Customer (PATCH)
export const patchCustomerProfileSchema = z.object({
  body: z
    .object({
      fullname: z.string().trim().min(1, 'Full name is required').optional(),
      phoneNumber: z
        .string()
        .trim()
        .min(1, 'Phone number is required')
        .optional(),
      dateOfBirth: z.string().optional(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      'At least one field is required',
    ),
});

// FEATURE 2 - NOMOR 2: Tipe data PATCH profil Customer
export type PatchCustomerProfileInput = z.infer<
  typeof patchCustomerProfileSchema
>;
