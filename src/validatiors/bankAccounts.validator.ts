import * as z from "zod";

const id = z.string().min(1, "ID is required");

const eventId = z.string().min(1, "Event ID is required");

const bankName = z
  .string()
  .trim()
  .min(1, "Bank name is required")
  .max(50, "Bank name must be at most 50 characters");

// disimpan sebagai string biar angka 0 di depan tidak hilang & tidak mentok batas Int
const accountNumber = z
  .string({ message: "Account number must be a string" })
  .trim()
  .regex(/^[0-9]+$/, "Account number must contain digits only")
  .min(5, "Account number must be at least 5 digits")
  .max(30, "Account number must be at most 30 digits");

const accountHolder = z
  .string()
  .trim()
  .min(1, "Account holder is required")
  .max(100, "Account holder must be at most 100 characters");

const isActive = z.boolean({ message: "isActive must be a boolean" });

export const bankAccountsCreateSchema = z.object({
  // organizerId tidak dikirim FE, dicari dari userId di token
  body: z.object({
    bankName,
    accountNumber,
    accountHolder,
    // default aktif, karena checkout cuma bisa pakai rekening yang aktif
    isActive: isActive.optional().default(true),
  }),
});

// rekening aktif milik EO pemilik event, dipakai customer untuk pilih rekening tujuan saat checkout
export const bankAccountsGetByEventSchema = z.object({
  params: z.object({
    eventId,
  }),
});

export const bankAccountsUpdatedSchema = z.object({
  params: z.object({
    id,
  }),
  // semua field optional, jadi bisa update sebagian (misal cuma nonaktifkan rekening)
  body: z
    .object({
      bankName,
      accountNumber,
      accountHolder,
      isActive,
    })
    .partial(),
});

export type BankAccountsCreateSchema = z.infer<typeof bankAccountsCreateSchema>;

export type BankAccountsGetByEventSchema = z.infer<typeof bankAccountsGetByEventSchema>;

export type BankAccountsUpdatedSchema = z.infer<typeof bankAccountsUpdatedSchema>;
