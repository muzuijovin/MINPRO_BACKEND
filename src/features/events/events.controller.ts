import { Request, Response } from "express";
import {
  eventsCreateSchema,
  eventsDeletedSchema,
  eventsGetDetailSchema,
  eventsGetSchema,
  eventUpdatedSchema,
} from "../../validatiors/events.validators";
import { EventsService } from "./events.service";
import { validate } from "../../validators/validate";

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

    res.status(200).json({
      success: true,
      message: "events get successfully",
      data: events,
      meta: {
        page,
        totalPage,
        limit,
        totalEvents,
      },
    });
  }

  static async getEventDetail(req: Request, res: Response) {
    const { params } = validate(eventsGetDetailSchema, { params: req?.params });

    const { event } = await EventsService.getEventDetail({ params });

    res.status(200).json({
      success: true,
      message: "event detail get successfully",
      data: event,
    });
  }

  static async getEventLocations(req: Request, res: Response) {
    const { locations } = await EventsService.getEventLocations();

    res.status(200).json({
      success: true,
      message: "event locations get successfully",
      data: locations,
    });
  }

  static async deleteEvents(req: Request, res: Response) {
    const { params } = validate(eventsDeletedSchema, { params: req?.params });

    const { deletedEvents } = await EventsService.deleteEvent({ params });

    res.status(200).json({
      success: true,
      message: "events deleted successfully",
      data: deletedEvents,
    });
  }

  static async updatedEvents(req: Request, res: Response) {
    // params & body divalidasi sekaligus karena schema nya mewajibkan keduanya
    const { params, body } = validate(eventUpdatedSchema, {
      params: req?.params,
      body: req?.body,
    });

    const {updateEvents} = await EventsService.updatedEvents({ params, body });

    res.status(200).json({
      success: true,
      message: "events updated successfully",
      data: updateEvents,
    });
  }
}
