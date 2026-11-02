import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auths.middleware";
import { OrganizerStatisticsController } from "./organizerStatistics.controller";

export const OrganizerStatisticsRoute = Router();

// statistik penjualan untuk dashboard EO, datanya dihitung dari tabel transactions
OrganizerStatisticsRoute.get("/", authenticate, authorize(["EO"]), OrganizerStatisticsController.getStatistics);
