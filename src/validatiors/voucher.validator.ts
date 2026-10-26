import * as z from "zod";

const id = z.string().min(1, "ID wajib diisi");

const eventId = z.string().min(1, "event id wajib ada");

// kode voucher disimpan uppercase biar "promo10" dan "PROMO10" dianggap sama (unique per event)
const code = z
  .string()
  .trim()
  .min(3, "Kode voucher minimal 3 karakter")
  .max(50, "Kode voucher maksimal 50 karakter")
  .regex(/^[A-Za-z0-9_-]+$/, "Kode voucher hanya boleh huruf, angka, - dan _")
  .transform((value) => value.toUpperCase());

const discountPercentage = z
  .number({ message: "Diskon harus berupa angka yang valid" })
  .gt(0, "Diskon harus lebih dari 0%")
  .max(100, "Diskon maksimal 100%");

const quota = z
  .number({ message: "Kuota harus berupa angka yang valid" })
  .int("Kuota harus berupa bilangan bulat")
  .min(1, "Kuota minimal 1");

const dateSchema = z.iso.datetime({
  message: "Format tanggal harus berupa ISO 8601",
});

const isActive = z.boolean({ message: "isActive harus berupa boolean" });

type VoucherBody = {
  startAt?: string;
  endAt?: string;
};

// aturan bisnis: endAt harus setelah startAt
// (cek endAt tidak melewati tanggal event dilakukan di service karena butuh data event)
function refineVoucherBody(body: VoucherBody, ctx: z.RefinementCtx) {
  if (body.startAt && body.endAt && new Date(body.endAt) <= new Date(body.startAt)) {
    ctx.addIssue({ code: "custom", path: ["endAt"], message: "Tanggal berakhir harus setelah tanggal mulai" });
  }
}

export const voucherCreateSchema = z.object({
  body: z
    .object({
      eventId,
      code,
      discountPercentage,
      quota,
      startAt: dateSchema,
      endAt: dateSchema,
      isActive: isActive.optional().default(true),
    })
    .superRefine(refineVoucherBody),
});

export const voucherGetSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1), //coerce ini ngubah string di query menjadi number
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    eventId: z.string().trim().optional(),
    search: z.string().trim().optional(),
  }),
});

export const voucherGetDetailSchema = z.object({
  params: z.object({
    id,
  }),
});

export const voucherDeletedSchema = z.object({
  params: z.object({
    id,
  }),
});

export const voucherUpdatedSchema = z.object({
  params: z.object({
    id,
  }),
  // semua field optional, eventId tidak bisa diubah (voucher terikat ke 1 event)
  body: z
    .object({
      code,
      discountPercentage,
      quota,
      startAt: dateSchema,
      endAt: dateSchema,
      isActive,
    })
    .partial()
    .superRefine(refineVoucherBody),
});

export type VoucherCreateSchema = z.infer<typeof voucherCreateSchema>;

export type VoucherGetSchema = z.infer<typeof voucherGetSchema>;

export type VoucherGetDetailSchema = z.infer<typeof voucherGetDetailSchema>;

export type VoucherDeletedSchema = z.infer<typeof voucherDeletedSchema>;

export type VoucherUpdatedSchema = z.infer<typeof voucherUpdatedSchema>;
