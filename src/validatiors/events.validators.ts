import * as z from "zod";
import { EventFormat, TypePrice } from "../generated/prisma/enums";

const id = z.string().min(1, "ID wajib diisi");

const organizerId = z.string().min(1, "organisasi id wajib ada");

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

const price = z
  .number()
  .finite("Harga harus berupa angka yang valid")
  .min(0, "Harga tidak boleh negatif");

const quota = z
  .number()
  .int("Kuota harus berupa bilangan bulat")
  .min(1, "Kuota minimal 1");

const dateSchema = z.iso.datetime({
  message: "Format tanggal harus berupa ISO 8601",
});

const startsAt = dateSchema.nullable().optional();

const endsAt = dateSchema.nullable().optional();

export const eventsCreateSchema = z.object({
  body: z.object({
    id,
    organizerId,
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
  }),
});

export const eventsGetSchema = z.object({
  query: z.object({
    page: z.coerce.number().optional().default(1), //coerce ini ngubah string di query menjadi number
    limit: z.coerce.number().optional().default(10),
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
  body: z.object({
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
})

export type EventsCreateSchema = z.infer<typeof eventsCreateSchema>;

export type EventsGetSchema = z.infer<typeof eventsGetSchema>

export type EventsDeletedSchema = z.infer<typeof eventsDeletedSchema>

export type EventUpdatedSchema = z.infer<typeof eventUpdatedSchema>
