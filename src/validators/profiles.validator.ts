import * as z from 'zod';

// FEATURE 2 - NOMOR 2: Validasi edit profil Customer
export const updateCustomerProfileSchema = z.object({
  body: z.object({
    fullname: z.string().trim().min(1, 'Full name is required'),
    phoneNumber: z.string().trim().min(1, 'Phone number is required'),
    dateOfBirth: z.string().optional(),
  }),
});

// FEATURE 2 - NOMOR 2: Tipe data edit profil Customer
export type UpdateCustomerProfileInput = z.infer<
  typeof updateCustomerProfileSchema
>;
