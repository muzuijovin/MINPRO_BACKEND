import { prisma } from '../../../config/prisma-client.config';
import { AppError } from '../../../errors/app.error';

export class PointsService {
  // FEATURE 2 - NOMOR 1: Mengambil referral points Customer
  static async getCustomerPoints(userId: string) {
    const findUser = await prisma.users.findFirst({
      where: {
        id: userId,
        role: 'CUSTOMER',
        deletedAt: null,
      },
    });

    if (!findUser) {
      throw new AppError(404, 'Customer not found');
    }

    // ===== TAMBAHAN 1: UBAH STATUS POINTS KEDALUWARSA =====
    const now = new Date();

    await prisma.pointLots.updateMany({
      where: {
        userId,
        deletedAt: null,
        expiresAt: {
          lte: now,
        },
        status: {
          in: ['AVAILABLE', 'PARTIALLY_USED'],
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });
    // ===== AKHIR TAMBAHAN 1 =====

    const pointLots = await prisma.pointLots.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        creditedAt: 'desc',
      },
    });

    const totalPoints = pointLots.reduce((total, lot) => {
      if (
        lot.expiresAt > now &&
        (lot.status === 'AVAILABLE' ||
          lot.status === 'PARTIALLY_USED')
      ) {
        return total + lot.pointsRemaining;
      }

      return total;
    }, 0);

    // ===== TAMBAHAN 2: PERBARUI TOTAL POINTS DI USERS =====
    await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        totalPoints,
      },
    });
    // ===== AKHIR TAMBAHAN 2 =====

    const pointLotsWithoutUserId = pointLots.map((lot) => {
      const { id, userId, referredUserId, ...safePointLot } = lot;

      return safePointLot;
    });

    return {
      totalPoints,
      pointLots: pointLotsWithoutUserId,
    };
  }
}