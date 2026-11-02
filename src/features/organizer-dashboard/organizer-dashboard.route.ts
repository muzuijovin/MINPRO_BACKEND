
import { Router } from 'express';
import { OrganizerDashboardController } from './organizer-dashboard.controller';
import { authenticate, authorize } from '../../middleware/auths.middleware';

export const OrganizerDashboardRoute = Router();

// FEATURE 2 - NOMOR 3: Dashboard Overview EO
OrganizerDashboardRoute.get(
  '/overview',
  authenticate,
  authorize(['EO']),
  OrganizerDashboardController.getDashboardOverview,
);

// FEATURE 2 - NOMOR 3: Statistics Visualization EO
OrganizerDashboardRoute.get(
  '/statistics',
  authenticate,
  authorize(['EO']),
  OrganizerDashboardController.getDashboardStatistics,
);
