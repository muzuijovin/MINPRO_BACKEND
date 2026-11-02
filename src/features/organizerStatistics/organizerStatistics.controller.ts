import { Request, Response } from "express";
import { validate } from "../../validators/validate";
import { organizerStatisticsGetSchema } from "../../validatiors/organizerStatistics.validator";
import { OrganizerStatisticsServices } from "./organizerStatistics.services";

export class OrganizerStatisticsController {
  static async getStatistics(req: Request, res: Response) {
    const { query } = validate(organizerStatisticsGetSchema, { query: req?.query });

    // id user yang login, diisi authenticate middleware dari token
    const { payload } = res.locals;

    const statistics = await OrganizerStatisticsServices.getStatistics({ query }, payload?.id);

    res.status(200).json({
      success: true,
      message: "get statistics successfully",
      data: statistics,
    });
  }
}
