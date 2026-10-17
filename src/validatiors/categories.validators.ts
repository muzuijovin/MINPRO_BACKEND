import * as z from "zod";

const id = z.string().min(1, "ID wajib diisi");

const name = z
  .string()
  .trim()
  .min(1, "Nama kategori wajib diisi")
  .max(100, "Nama kategori maksimal 100 karakter");

const parentId = z
  .string()
  .uuid("Parent ID harus berupa UUID yang valid")
  .optional()
  .nullable();

export const categoriesCreateSchema = z.object({
  body: z.object({
    id,
    name,
    parentId,
  }),
});

export const categoriesGetSchema = z.object({
  query: z.object({
    page: z.coerce.number().optional().default(1), //coerce ini ngubah string di query menjadi number
    limit: z.coerce.number().optional().default(10),
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
  body: z.object({
    name,
  }),
});

export type CategoriesCreateSchema = z.infer<typeof categoriesCreateSchema>;

export type CategoriesGetSchema = z.infer<typeof categoriesGetSchema>;

export type CategoriesDeletedSchema = z.infer<typeof categoriesDeletedSchema>;

export type CategoriesupdatedSchema = z.infer<typeof categoriesupdatedSchema>;
