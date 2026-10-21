import * as z from "zod";

const id = z.string().min(1, "ID is required");

const name = z
  .string()
  .trim()
  .min(1, "Category name is required")
  .max(100, "Category name must be at most 100 characters");

const parentId = z
  .string()
  .uuid("Parent ID must be a valid UUID")
  .optional()
  .nullable();

// id tidak perlu dikirim, otomatis dibuat oleh database (uuid)
export const categoriesCreateSchema = z.object({
  body: z.object({
    name,
    parentId,
  }),
});

export const categoriesGetSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1), //coerce ini ngubah string di query menjadi number
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().trim().optional(),
    // "root" = hanya parent category, atau isi dengan id parent untuk ambil sub category nya
    parentId: z.string().trim().optional(),
  }),
});

export const categoriesDeletedSchema = z.object({
  params: z.object({
    id,
  }),
});

export const categoriesupdatedSchema = z.object({
  params: z.object({
    id,
  }),
  body: z
    .object({
      name,
      parentId,
    })
    .partial(),
});

export type CategoriesCreateSchema = z.infer<typeof categoriesCreateSchema>;

export type CategoriesGetSchema = z.infer<typeof categoriesGetSchema>;

export type CategoriesDeletedSchema = z.infer<typeof categoriesDeletedSchema>;

export type CategoriesupdatedSchema = z.infer<typeof categoriesupdatedSchema>;
