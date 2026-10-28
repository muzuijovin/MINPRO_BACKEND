import { prisma } from "../../config/prisma-cllient.config";
import { AppError } from "../../errors/app.error";
import { NotificationType, Prisma } from "../../generated/prisma/client";
import { NotificationsGetSchema, NotificationsReadSchema } from "../../validatiors/notifications.validator";

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export type NewNotification = {
  userId: string;
  transactionId?: string;
  type: NotificationType;
  title: string;
  message: string;
};

export class NotificationsServices {
  // dipanggil dari service lain (misal transactions) di dalam $transaction yang sama,
  // jadi kalau perubahan status gagal, notifikasinya juga ikut batal
  static async createNotifications(tx: PrismaTx, notifications: NewNotification[]) {
    if (!notifications.length) return;

    await tx.notifications.createMany({ data: notifications });
  }

  // notifikasi milik user yang login, terbaru di atas
  static async getNotifications({ query }: NotificationsGetSchema, userId: string) {
    const offset = (query?.page - 1) * query?.limit;

    const where: Prisma.NotificationsWhereInput = { userId };

    if (query?.isRead !== undefined) where.isRead = query.isRead;

    const [notifications, totalNotifications, unreadCount] = await Promise.all([
      prisma.notifications.findMany({
        where,
        take: query?.limit,
        skip: offset,
        include: {
          transactions: {
            select: {
              id: true,
              transactionCode: true,
              status: true,
              events: { select: { title: true, slug: true } },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.notifications.count({ where }),
      prisma.notifications.count({ where: { userId, isRead: false } }),
    ]);

    const totalPage = Math.ceil(totalNotifications / query.limit);

    return {
      page: query?.page,
      totalPage,
      limit: query?.limit,
      notifications,
      totalNotifications,
      unreadCount,
    };
  }

  // angka merah di ikon lonceng, dipanggil FE berkala (misal tiap 30 detik)
  static async getUnreadCount(userId: string) {
    const unreadCount = await prisma.notifications.count({
      where: { userId, isRead: false },
    });

    return { unreadCount };
  }

  static async markAsRead({ params }: NotificationsReadSchema, userId: string) {
    const findNotificationById = await prisma.notifications.findFirst({
      where: { id: params.id },
    });

    if (!findNotificationById) throw new AppError(404, "Notification not found");

    // user cuma boleh menandai notifikasi miliknya sendiri
    if (findNotificationById.userId !== userId)
      throw new AppError(403, "You are not the owner of this notification");

    // sudah dibaca sebelumnya, tidak perlu update lagi (readAt tetap waktu pertama dibaca)
    if (findNotificationById.isRead) return findNotificationById;

    return await prisma.notifications.update({
      where: { id: params.id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  static async markAllAsRead(userId: string) {
    const updated = await prisma.notifications.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { updatedCount: updated.count };
  }
}
