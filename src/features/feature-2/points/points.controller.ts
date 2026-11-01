
import { Request, Response } from 'express';
import { PointsService } from './points.service';

export class PointsController {
  // FEATURE 2 - NOMOR 1: Mengambil referral points Customer
  static async getCustomerPoints(req: Request, res: Response) {
    const { id } = res.locals.payload;

    const { totalPoints, pointLots } =
      await PointsService.getCustomerPoints(id);

    res.status(200).json({
      success: true,
      message: 'Customer points retrieved successfully',
      data: {
        totalPoints,
        pointLots,
      },
    });
  }
}
