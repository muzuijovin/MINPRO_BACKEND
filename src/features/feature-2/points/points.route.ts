
import { Router } from 'express';
import { PointsController } from './points.controller';
import {
  authenticate,
  authorize,
} from '../../../middleware/auths.middleware';

export const PointsRoute = Router();

// FEATURE 2 - NOMOR 1: Mengambil referral points Customer
PointsRoute.get(
  '/customer',
  authenticate,
  authorize(['CUSTOMER']),
  PointsController.getCustomerPoints,
);
