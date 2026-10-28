import * as z from "zod";

export const organizerStatisticsGetSchema = z.object({
  query: z.object({
    // year = grafik per tahun, month = per bulan dalam 1 tahun, day = per hari dalam 1 bulan
    groupBy: z.enum(["year", "month", "day"]).optional().default("month"),
    // dipakai saat groupBy month / day, default tahun sekarang
    // pakai function biar dihitung tiap request (bukan sekali saat server nyala)
    year: z.coerce.number().int().min(2000).max(2100).optional().default(() => new Date().getFullYear()),
    // dipakai saat groupBy day, default bulan sekarang (1 - 12)
    month: z.coerce.number().int().min(1).max(12).optional().default(() => new Date().getMonth() + 1),
    // kosong = semua event milik EO
    eventId: z.string().trim().optional(),
  }),
});

export type OrganizerStatisticsGetSchema = z.infer<typeof organizerStatisticsGetSchema>;
