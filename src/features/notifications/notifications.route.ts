import { Router } from "express";
import { authenticate } from "../../middleware/auths.middleware";
import { NotificationsController } from "./notifications.controller";

export const NotificationsRoute = Router();

// customer & EO sama-sama punya notifikasi, masing-masing cuma bisa lihat miliknya sendiri
NotificationsRoute.get("/", authenticate, NotificationsController.getNotifications);
NotificationsRoute.get("/unread-count", authenticate, NotificationsController.getUnreadCount);
NotificationsRoute.patch("/read-all", authenticate, NotificationsController.markAllAsRead);
NotificationsRoute.patch("/:id/read", authenticate, NotificationsController.markAsRead);
