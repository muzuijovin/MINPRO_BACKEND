import { Router } from 'express';
import { ProfilesController } from './profiles.controller';
import { authenticate, authorize } from '../../middleware/auths.middleware';

export const ProfilesRoute = Router();

// Hanya Customer yang sudah login dapat mengedit profilnya
ProfilesRoute.put(
  '/customer',
  authenticate,
  authorize(['CUSTOMER']),
  ProfilesController.updateCustomerProfile,
);