
import { Request, Response } from 'express';
import { OrganizerDashboardService } from './organizer-dashboard.service';
import { AppError } from '../../errors/app.error';

export class OrganizerDashboardController {
  // FEATURE 2 - NOMOR 3: Dashboard Overview EO
  static async getDashboardOverview(req: Request, res: Response) {
    // Ambil ID EO dari JWT yang sudah diverifikasi
    const { id } = res.locals.payload;

    // Panggil Service untuk mengambil statistik dashboard
    const dashboardOverview =
      await OrganizerDashboardService.getDashboardOverview(id);

    res.status(200).json({
      success: true,
      message: 'Organizer dashboard overview retrieved successfully',
      data: dashboardOverview,
    });
  }

  // FEATURE 2 - NOMOR 3: Statistics Visualization EO
  static async getDashboardStatistics(req: Request, res: Response) {
    // 1. Ambil ID EO dari JWT
    const { id } = res.locals.payload;

    // 2. Ambil periode dari query parameter
    const period = req.query.period ?? 'month';

    // 3. Validasi periode
    if (
      period !== 'day' &&
      period !== 'month' &&
      period !== 'year'
    ) {
      throw new AppError(
        400,
        'Period must be day, month, or year',
      );
    }

    // 4. Panggil Service untuk mengambil statistik
    const dashboardStatistics =
      await OrganizerDashboardService.getDashboardStatistics(
        id,
        period,
      );

    // 5. Kirim response
    res.status(200).json({
      success: true,
      message: 'Organizer dashboard statistics retrieved successfully',
      data: dashboardStatistics,
    });
  }
}
