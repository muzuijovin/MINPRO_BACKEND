import { Request, Response } from "express";
import { validate } from "../../validators/validate";
import { notificationsGetSchema, notificationsReadSchema } from "../../validatiors/notifications.validator";
import { NotificationsServices } from "./notifications.services";

export class NotificationsController {
  static async getNotifications(req: Request, res: Response) {
    const { query } = validate(notificationsGetSchema, { query: req?.query });

    // id user yang login, diisi authenticate middleware dari token
    const { payload } = res.locals;

    const { page, totalPage, limit, notifications, totalNotifications, unreadCount } =
      await NotificationsServices.getNotifications({ query }, payload?.id);

    res.status(200).json({
      success: true,
      message: "get notifications successfully",
      data: notifications,
      meta: {
        page,
        totalPage,
        limit,
        totalNotifications,
        unreadCount,
      },
    });
  }

  static async getUnreadCount(req: Request, res: Response) {
    const { payload } = res.locals;

    const unreadCount = await NotificationsServices.getUnreadCount(payload?.id);

    res.status(200).json({
      success: true,
      message: "get unread count successfully",
      data: unreadCount,
    });
  }

  static async markAsRead(req: Request, res: Response) {
    const { params } = validate(notificationsReadSchema, { params: req?.params });

    const { payload } = res.locals;

    const notification = await NotificationsServices.markAsRead({ params }, payload?.id);

    res.status(200).json({
      success: true,
      message: "mark notification as read successfully",
      data: notification,
    });
  }

  static async markAllAsRead(req: Request, res: Response) {
    const { payload } = res.locals;

    const result = await NotificationsServices.markAllAsRead(payload?.id);

    res.status(200).json({
      success: true,
      message: "mark all notifications as read successfully",
      data: result,
    });
  }
}
