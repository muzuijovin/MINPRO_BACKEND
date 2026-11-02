
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



// FEATURE 2 - NOMOR 2: Validasi isi dan edit profil EO (PUT)
export const updateOrganizerProfileSchema = z.object({
  body: z.object({
    organizationName: z.string().trim().min(1, 'Organization name is required'),
    fullName: z.string().trim().min(1, 'Full name is required'),
    nik: z.string().regex(/^\d{16}$/, 'NIK must contain exactly 16 digits'),
    nib: z.string().regex(/^\d{13}$/, 'NIB must contain exactly 13 digits'),
    npwp: z.string().trim().optional(),
    phoneNumber: z.string().trim().min(1, 'Phone number is required'),
    businessAddress: z.string().trim().min(1, 'Business address is required'),
  }),
});

export type UpdateOrganizerProfileInput = z.infer<
  typeof updateOrganizerProfileSchema
>;

// FEATURE 2 - NOMOR 2: Validasi edit sebagian profil EO (PATCH)
export const patchOrganizerProfileSchema = z.object({
  body: z
    .object({
      organizationName: z.string().trim().min(1).optional(),
      fullName: z.string().trim().min(1).optional(),
      npwp: z.string().trim().optional(),
      phoneNumber: z.string().trim().min(1).optional(),
      businessAddress: z.string().trim().min(1).optional(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      'At least one field is required',
    ),
});

export type PatchOrganizerProfileInput = z.infer<
  typeof patchOrganizerProfileSchema
>;