import { Router } from "express";
import { uploadMiddleware } from "../../middleware/apload.middleware";
import { EventsController } from "./events.controller";

export const EventsRoute = Router();

EventsRoute.post(
  '/',
  uploadMiddleware(["jpg", "jpeg", "png", "svg", "webp"], "MEMORY").fields([
    { name: "coverImage", maxCount: 1 }]), EventsController.createEvent 
 )

EventsRoute.get('/', EventsController.getEvents)
EventsRoute.delete('/:id', EventsController.deleteEvents)
EventsRoute.put('/:id', EventsController.updatedEvents)