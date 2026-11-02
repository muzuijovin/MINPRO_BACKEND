import { prisma } from '../../config/prisma-client.config';
import { AppError } from '../../errors/app.error';

export class OrganizerDashboardService {
  // FEATURE 2 - NOMOR 3: Dashboard Overview EO
  static async getDashboardOverview(userId: string) {
    // 1. Cari profil EO yang sedang login
    const findProfile = await prisma.organizerProfiles.findFirst({
      where: {
        userId,
        deletedAt: null,
        users: {
          role: 'EO',
          deletedAt: null,
        },
      },
    });

    if (!findProfile) {
      throw new AppError(404, 'Organizer profile not found');
    }

    // 2. Hitung total event milik EO
    const totalEvents = await prisma.events.count({
      where: {
        organizerId: findProfile.id,
        deletedAt: null,
      },
    });

    // 3. Ambil transaksi PAID dari event milik EO
    const paidTransactions = await prisma.transactions.findMany({
      where: {
        status: 'PAID',
        deletedAt: null,
        events: {
          organizerId: findProfile.id,
          deletedAt: null,
        },
      },
      select: {
        customerId: true,
        quantity: true,
        finalAmount: true,
      },
    });

    // 4. Hitung total tiket terjual
    const totalTicketsSold = paidTransactions.reduce(
      (total, transaction) => total + transaction.quantity,
      0,
    );

    // 5. Hitung total pendapatan
    const totalRevenue = paidTransactions.reduce(
      (total, transaction) =>
        total + Number(transaction.finalAmount),
      0,
    );

    // 6. Hitung jumlah pelanggan unik
    const totalAttendees = new Set(
      paidTransactions.map((transaction) => transaction.customerId),
    ).size;

    return {
      totalEvents,
      totalTicketsSold,
      totalRevenue,
      totalAttendees,
    };
  }

// =================================================================================
  
  // FEATURE 2 - NOMOR 3: Statistics Visualization EO
  static async getDashboardStatistics(
    userId: string,
    period: 'day' | 'month' | 'year',
  ) {
    // 1. Cari profil EO yang sedang login
    const findProfile = await prisma.organizerProfiles.findFirst({
      where: {
        userId,
        deletedAt: null,
        users: {
          role: 'EO',
          deletedAt: null,
        },
      },
    });

    if (!findProfile) {
      throw new AppError(404, 'Organizer profile not found');
    }

    // 2. Tentukan rentang waktu statistik (UTC)
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (period === 'day') {
      startDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + 1);
    } else if (period === 'month') {
      startDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
      );
      endDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
      );
    } else {
      startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      endDate = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));
    }

    // 3. Ambil transaksi PAID milik EO
    const paidTransactions = await prisma.transactions.findMany({
      where: {
        status: 'PAID',
        deletedAt: null,
        confirmedAt: {
          gte: startDate,
          lt: endDate,
        },
        events: {
          organizerId: findProfile.id,
          deletedAt: null,
        },
      },
      select: {
        quantity: true,
        finalAmount: true,
        confirmedAt: true,
      },
    });

    // 4. Siapkan kelompok data berdasarkan periode
    const statistics: {
      label: string;
      ticketsSold: number;
      revenue: number;
    }[] = [];

    const totalBuckets =
      period === 'day'
        ? 24
        : period === 'month'
          ? new Date(
              Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
            ).getUTCDate()
          : 12;

    for (let i = 0; i < totalBuckets; i++) {
      const label =
        period === 'day'
          ? `${String(i).padStart(2, '0')}:00`
          : period === 'month'
            ? String(i + 1)
            : new Date(Date.UTC(2000, i, 1)).toLocaleString('en-US', {
                month: 'short',
                timeZone: 'UTC',
              });

      statistics.push({
        label,
        ticketsSold: 0,
        revenue: 0,
      });
    }

    // 5. Hitung Tickets Sold dan Revenue setiap periode
    paidTransactions.forEach((transaction) => {
      if (!transaction.confirmedAt) return;

      const date = transaction.confirmedAt;

      const index =
        period === 'day'
          ? date.getUTCHours()
          : period === 'month'
            ? date.getUTCDate() - 1
            : date.getUTCMonth();

      statistics[index].ticketsSold += transaction.quantity;
      statistics[index].revenue += Number(transaction.finalAmount);
    });

    // 6. Kembalikan hasil statistik
    return {
      period,
      statistics,
    };
  }

}