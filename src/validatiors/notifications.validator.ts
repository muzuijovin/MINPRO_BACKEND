import * as z from "zod";

const id = z.string().min(1, "ID is required");

export const notificationsGetSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1), //coerce ini ngubah string di query menjadi number
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    // query string selalu string, jadi "true" / "false" diubah manual ke boolean
    isRead: z
      .enum(["true", "false"], { message: "isRead must be true or false" })
      .transform((value) => value === "true")
      .optional(),
  }),
});

export const notificationsReadSchema = z.object({
  params: z.object({
    id,
  }),
});

export type NotificationsGetSchema = z.infer<typeof notificationsGetSchema>;

export type NotificationsReadSchema = z.infer<typeof notificationsReadSchema>;
