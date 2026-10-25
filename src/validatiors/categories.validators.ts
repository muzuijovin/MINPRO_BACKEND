import * as z from "zod";

export const categoriesGetSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1), //coerce ini ngubah string di query menjadi number
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().trim().optional(),
    // "root" = hanya parent category, atau isi dengan id parent untuk ambil sub category nya
    parentId: z.string().trim().optional(),
  }),
});

export type CategoriesGetSchema = z.infer<typeof categoriesGetSchema>;
