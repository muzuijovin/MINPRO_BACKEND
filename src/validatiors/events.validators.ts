import * as z from "zod";
import { EventFormat, TypePrice } from "../generated/prisma/enums";

const id = z.string().min(1, "ID wajib diisi");

const slug = z.string().trim().min(1, "Slug wajib diisi");

const categoryId = z.string().min(1, "category id wajib ada");

const title = z
  .string()
  .trim()
  .min(1, "Judul event wajib diisi")
  .max(200, "Judul event maksimal 200 karakter");

const description = z
  .string()
  .trim()
  .min(1, "Deskripsi event wajib diisi")
  .max(2000, "Deskripsi maksimal 2000 karakter");

const location = z
  .string()
  .trim()
  .min(1, "Lokasi event wajib diisi")
  .max(300, "Lokasi maksimal 300 karakter");

const format = z.enum(EventFormat);

const typePrice = z.enum(TypePrice);

// pakai coerce karena create event dikirim lewat multipart/form-data (semua value jadi string)
const price = z.coerce
  .number({ message: "Harga harus berupa angka yang valid" })
  .min(0, "Harga tidak boleh negatif");

const quota = z.coerce
  .number()
  .int("Kuota harus berupa bilangan bulat")
  .min(1, "Kuota minimal 1");

const dateSchema = z.iso.datetime({
  message: "Format tanggal harus berupa ISO 8601",
});

const startsAt = dateSchema.nullable().optional();

const endsAt = dateSchema.nullable().optional();

type EventBody = {
  typePrice?: TypePrice;
  price?: number;
  startsAt?: string | null;
  endsAt?: string | null;
};

// aturan bisnis: event FREE harganya 0, event PAID harganya > 0, dan endsAt harus setelah startsAt
function refineEventBody(body: EventBody, ctx: z.RefinementCtx) {
  if (body.typePrice === "FREE" && body.price !== undefined && body.price !== 0) {
    ctx.addIssue({ code: "custom", path: ["price"], message: "Event gratis harus memiliki harga 0" });
  }

  if (body.typePrice === "PAID" && body.price !== undefined && body.price <= 0) {
    ctx.addIssue({ code: "custom", path: ["price"], message: "Event berbayar harus memiliki harga lebih dari 0" });
  }

  if (body.startsAt && body.endsAt && new Date(body.endsAt) <= new Date(body.startsAt)) {
    ctx.addIssue({ code: "custom", path: ["endsAt"], message: "Tanggal selesai harus setelah tanggal mulai" });
  }
}

export const eventsCreateSchema = z.object({
  body: z
    .object({
      // organizerId tidak dikirim FE, diambil dari token di controller
      categoryId,
      title,
      description,
      location,
      format,
      typePrice,
      price,
      quota,
      startsAt,
      endsAt,
    })
    .superRefine(refineEventBody)
    // khusus create: event baru tidak boleh dijadwalkan di waktu yang sudah lewat
    // (tidak dipasang di update, biar event yang sudah berjalan tetap bisa diedit)
    .superRefine((body, ctx) => {
      if (body.startsAt && new Date(body.startsAt) <= new Date()) {
        ctx.addIssue({ code: "custom", path: ["startsAt"], message: "Tanggal mulai harus setelah waktu sekarang" });
      }
    }),
});

export const eventsGetSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1), //coerce ini ngubah string di query menjadi number
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),

    // keyword dari search bar (debounce nya di FE), dicari di title, description & location
    search: z.string().trim().optional(),
    // slug category, kalau parent category (misal "running") maka sub category nya (5K, 10K, dst) ikut ke filter
    category: z.string().trim().optional(),
    location: z.string().trim().optional(),
    typePrice: typePrice.optional(),
    format: format.optional(),
    organizerId: z.string().trim().optional(),

    // upcoming = event yang belum mulai (untuk landing page), past = event yang sudah lewat
    time: z.enum(["upcoming", "past", "all"]).optional().default("upcoming"),

    sortBy: z.enum(["startsAt", "createdAt", "price"]).optional().default("startsAt"),
    order: z.enum(["asc", "desc"]).optional().default("asc"),
  }),
});

export const eventsGetDetailSchema = z.object({
  params: z.object({
    slug,
  }),
});

export const eventsDeletedSchema = z.object({
  params: z.object({
    id
  })
})

export const eventUpdatedSchema = z.object({
  params: z.object({
    id
  }),
  // semua field optional, jadi bisa update sebagian (yang tidak dikirim tidak berubah)
  body: z
    .object({
      categoryId,
      title,
      description,
      location,
      format,
      typePrice,
      price,
      quota,
      startsAt,
      endsAt
    })
    .partial()
    .superRefine(refineEventBody)
})

export type EventsCreateSchema = z.infer<typeof eventsCreateSchema>;

export type EventsGetSchema = z.infer<typeof eventsGetSchema>

export type EventsGetDetailSchema = z.infer<typeof eventsGetDetailSchema>

export type EventsDeletedSchema = z.infer<typeof eventsDeletedSchema>

export type EventUpdatedSchema = z.infer<typeof eventUpdatedSchema>
