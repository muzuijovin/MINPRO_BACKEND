import * as z from "zod";

const eventId = z.string().min(1, "Event ID is required");

const rating = z
  .number({ message: "Rating must be a valid number" })
  .int("Rating must be an integer")
  .min(1, "Rating must be at least 1")
  .max(5, "Rating must be at most 5");

const comment = z
  .string()
  .trim()
  .min(1, "Comment is required")
  .max(1000, "Comment must be at most 1000 characters");

export const reviewsCreateSchema = z.object({
  // customerId tidak dikirim FE, diambil dari token di controller
  body: z.object({
    eventId,
    rating,
    comment,
  }),
});

export const reviewsGetSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1), //coerce ini ngubah string di query menjadi number
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    // review 1 event (halaman detail event)
    eventId: z.string().trim().optional(),
    // review semua event milik 1 EO (halaman profil EO)
    organizerId: z.string().trim().optional(),
  }),
});

export type ReviewsCreateSchema = z.infer<typeof reviewsCreateSchema>;

export type ReviewsGetSchema = z.infer<typeof reviewsGetSchema>;
