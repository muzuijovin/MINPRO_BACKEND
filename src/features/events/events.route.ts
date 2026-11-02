import { Router } from "express";
import { EventsController } from "./events.controller";
import { uploadMiddleware } from "../../middleware/upload.middleware";
import { authenticate, authorize } from "../../middleware/auths.middleware";

export const EventsRoute = Router();

// hanya user dengan role EO (organizer) yang boleh create event
// authenticate = cek token di cookie & simpan payload ke res.locals, authorize = cek role dari payload
// urutannya wajib authenticate dulu baru authorize, dan sebelum upload biar file tidak diproses kalau user tidak berhak
EventsRoute.post(
  '/',
  authenticate,
  authorize(["EO"]),
  uploadMiddleware(["jpg", "jpeg", "png", "svg", "webp"], "MEMORY").fields([
    { name: "coverImage", maxCount: 1 }]), EventsController.createEvent
 )

EventsRoute.get('/', EventsController.getEvents)
// '/locations' harus di atas '/:slug', kalau tidak "locations" kebaca sebagai slug
EventsRoute.get('/locations', EventsController.getEventLocations)
EventsRoute.get('/:slug', EventsController.getEventDetail)
// update & delete juga cuma boleh EO, kepemilikan event nya dicek di service
EventsRoute.delete('/:id', authenticate, authorize(["EO"]), EventsController.deleteEvents)
EventsRoute.put('/:id', authenticate, authorize(["EO"]), EventsController.updatedEvents)
