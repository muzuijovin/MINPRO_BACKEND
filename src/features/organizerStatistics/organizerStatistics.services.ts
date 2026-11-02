import { prisma } from "../../config/prisma-cllient.config";
import { AppError } from "../../errors/app.error";
import { Prisma } from "../../generated/prisma/client";
import { OrganizerStatisticsGetSchema } from "../../validatiors/organizerStatistics.validator";

// tanggal dihitung pakai waktu Indonesia (WIB = UTC+7), biar transaksi jam 01:00 WIB
// tidak masuk ke hari sebelumnya walaupun server (Vercel) pakai UTC
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function toWib(date: Date) {
  const wib = new Date(date.getTime() + WIB_OFFSET_MS);
  return { year: wib.getUTCFullYear(), month: wib.getUTCMonth() + 1, day: wib.getUTCDate() };
}

// awal suatu tanggal di WIB, dikembalikan dalam UTC untuk query ke database
function wibDate(year: number, month = 1, day = 1) {
  return new Date(Date.UTC(year, month - 1, day) - WIB_OFFSET_MS);
}

type ChartItem = {
  label: string;
  ticketsSold: number;
  revenue: number;
  transactions: number;
};

export class OrganizerStatisticsServices {
  static async getStatistics({ query }: OrganizerStatisticsGetSchema, userId: string) {
    // eventId harus milik EO yang login
    if (query.eventId) {
      const findEventById = await prisma.events.findFirst({
        where: {
          id: query.eventId,
          organizer: { userId },
          deletedAt: null,
        },
      });

      if (!findEventById) throw new AppError(404, "Event not found");
    }

    const where: Prisma.TransactionsWhereInput = {
      events: { organizer: { userId } },
      deletedAt: null,
    };

    if (query.eventId) where.eventId = query.eventId;

    // jumlah transaksi per status, misal untuk badge "5 menunggu konfirmasi"
    const statusGroups = await prisma.transactions.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    });

    const transactionsByStatus = Object.fromEntries(
      statusGroups.map((group) => [group.status, group._count._all]),
    );

    // yang dihitung sebagai penjualan cuma transaksi PAID, tanggalnya pakai confirmedAt (waktu jadi PAID)
    const paidTransactions = await prisma.transactions.findMany({
      where: { ...where, status: "PAID", confirmedAt: { not: null } },
      select: { quantity: true, finalAmount: true, confirmedAt: true },
    });

    const summary = {
      ticketsSold: 0,
      revenue: 0,
      transactions: paidTransactions.length,
    };

    for (const transaction of paidTransactions) {
      summary.ticketsSold += transaction.quantity;
      summary.revenue += Number(transaction.finalAmount);
    }

    const chart = this.buildChart(paidTransactions, query);

    return { summary, transactionsByStatus, chart };
  }

  // kelompokkan transaksi PAID per tahun / bulan / hari untuk grafik
  // periode yang tidak ada penjualan tetap ditampilkan dengan nilai 0 biar grafiknya tidak bolong
  private static buildChart(
    paidTransactions: { quantity: number; finalAmount: Prisma.Decimal; confirmedAt: Date | null }[],
    query: OrganizerStatisticsGetSchema["query"],
  ) {
    const chart = new Map<string, ChartItem>();
    const addLabel = (label: string) => chart.set(label, { label, ticketsSold: 0, revenue: 0, transactions: 0 });

    if (query.groupBy === "year") {
      // dari tahun penjualan pertama sampai tahun sekarang
      const currentYear = toWib(new Date()).year;
      const years = paidTransactions.map((transaction) => toWib(transaction.confirmedAt!).year);
      const firstYear = Math.min(currentYear, ...years);

      for (let year = firstYear; year <= currentYear; year++) addLabel(`${year}`);
    }

    if (query.groupBy === "month") {
      for (let month = 1; month <= 12; month++) addLabel(`${query.year}-${String(month).padStart(2, "0")}`);
    }

    if (query.groupBy === "day") {
      // tanggal 0 bulan berikutnya = tanggal terakhir bulan ini
      const daysInMonth = new Date(Date.UTC(query.year, query.month, 0)).getUTCDate();
      const month = String(query.month).padStart(2, "0");

      for (let day = 1; day <= daysInMonth; day++)
        addLabel(`${query.year}-${month}-${String(day).padStart(2, "0")}`);
    }

    for (const transaction of paidTransactions) {
      const { year, month, day } = toWib(transaction.confirmedAt!);

      const label =
        query.groupBy === "year"
          ? `${year}`
          : query.groupBy === "month"
            ? `${year}-${String(month).padStart(2, "0")}`
            : `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // transaksi di luar periode yang dipilih (misal beda tahun) tidak masuk grafik
      const item = chart.get(label);
      if (!item) continue;

      item.ticketsSold += transaction.quantity;
      item.revenue += Number(transaction.finalAmount);
      item.transactions += 1;
    }

    return {
      groupBy: query.groupBy,
      // range periode grafik (WIB), berguna untuk judul grafik di FE
      period:
        query.groupBy === "year"
          ? null
          : query.groupBy === "month"
            ? { from: wibDate(query.year), to: wibDate(query.year + 1) }
            : { from: wibDate(query.year, query.month), to: wibDate(query.year, query.month + 1) },
      data: [...chart.values()],
    };
  }
}
