import { ZodType } from 'zod';
import { AppError } from '../errors/app.error';

export function validate(schema: ZodType, data: unknown): any {
  const result = schema.safeParse(data);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => issue.message)
      .join(', ');

    // Lempar error dengan status code (misal 400 Bad Request) dan detail pesannya
    throw new AppError(422, details);
  }

  // Jangan lupa kembalikan data yang valid jika sukses
  return result.data;
}
