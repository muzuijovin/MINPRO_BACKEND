import { Router } from 'express';
import { ProfilesController } from './profiles.controller';
import { authenticate, authorize } from '../../middleware/auths.middleware';
import { uploadMiddleware } from '../../middleware/upload.middleware';

export const ProfilesRoute = Router();

// FEATURE 2 - NOMOR 2: Mengambil profil Customer
ProfilesRoute.get(
  '/customer',
  authenticate,
  authorize(['CUSTOMER']),
  ProfilesController.getCustomerProfile,
);

// FEATURE 2 - NOMOR 2: Isi dan edit profil Customer
ProfilesRoute.put(
  '/customer',
  authenticate,
  authorize(['CUSTOMER']),
  ProfilesController.updateCustomerProfile,
);

// FEATURE 2 - NOMOR 2: Edit sebagian data profil Customer
ProfilesRoute.patch(
  '/customer',
  authenticate,
  authorize(['CUSTOMER']),
  ProfilesController.patchCustomerProfile,
);

// FEATURE 2 - NOMOR 2: Upload dan edit foto profil Customer
ProfilesRoute.patch(
  '/customer/avatar',
  authenticate,
  authorize(['CUSTOMER']),
  uploadMiddleware(['jpg', 'jpeg', 'png'], 'MEMORY').single('avatar'),
  ProfilesController.updateCustomerAvatar,
);

// FEATURE 2 - NOMOR 2: Mengambil profil EO
ProfilesRoute.get(
  '/organizer',
  authenticate,
  authorize(['EO']),
  ProfilesController.getOrganizerProfile,
);

// FEATURE 2 - NOMOR 2: Isi dan edit profil EO
ProfilesRoute.put(
  '/organizer',
  authenticate,
  authorize(['EO']),
  ProfilesController.updateOrganizerProfile,
);

// FEATURE 2 - NOMOR 2: Edit sebagian profil EO
ProfilesRoute.patch(
  '/organizer',
  authenticate,
  authorize(['EO']),
  ProfilesController.patchOrganizerProfile,
);

// FEATURE 2 - NOMOR 2: Upload dan edit logo profil EO
ProfilesRoute.patch(
  '/organizer/logo',
  authenticate,
  authorize(['EO']),
  uploadMiddleware(['jpg', 'jpeg', 'png'], 'MEMORY').single('logo'),
  ProfilesController.updateOrganizerLogo,
);