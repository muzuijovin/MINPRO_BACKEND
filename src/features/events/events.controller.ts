import { Request, Response } from "express";
import { validate } from "../../validatiors/validate";
import {
  eventsCreateSchema,
  eventsDeletedSchema,
  eventsGetSchema,
  eventUpdatedSchema,
} from "../../validatiors/events.validators";
import { EventsService } from "./events.service";

export class EventsController {
  static async createEvent(req: Request, res: Response) {
    const files: Express.Multer.File[] =
      (
        req.files as { [fieldname: string]: Express.Multer.File[] } | undefined
      )?.["coverImage"] ?? [];

    const { body } = validate(eventsCreateSchema, { body: req.body });

    const createEvent = await EventsService.createEvent({ body }, files);

    res.status(201).json({
      success: true,
      message: "events created successfully",
      data: createEvent,
    });
  }

  static async getEvents(req: Request, res: Response) {
    const { query } = validate(eventsGetSchema, { query: req.query });

    const { page, totalPage, limit, events, totalEvents } =
      await EventsService.getEvent({ query });

    res.status(201).json({
      success: true,
      message: "events get successfully",
      data: events,
      meta: {
        page,
        totalPage,
        limit,
        events,
        totalEvents,
      },
    });
  }

  static async deleteEvents(req: Request, res: Response) {
    const { params } = validate(eventsDeletedSchema, { params: req?.params });

    const { deletedEvents } = await EventsService.deleteEvent({ params });

    res.status(201).json({
      success: true,
      message: "events deleted successfully",
      data: deletedEvents,
    });
  }

  static async updatedEvents(req: Request, res: Response) {
    const { params } = validate(eventUpdatedSchema, { query: req?.params });

    const { body } = validate(eventUpdatedSchema, { body: req?.body });

    const {updateEvents} = await EventsService.updatedEvents({ params, body });

    res.status(201).json({
      success: true,
      message: "events updated successfully",
      data: updateEvents,
    });
  }
}
