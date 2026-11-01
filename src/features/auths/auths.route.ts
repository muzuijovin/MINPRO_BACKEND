import { Router } from 'express';
import { AuthController } from './auths.controller';
import { authenticate, authorize } from '../../middleware/auths.middleware';


export const AuthsRoute = Router();

AuthsRoute.post(
  '/register/customer',
  AuthController.registerForCustomer,
);

AuthsRoute.post(
  '/register/eo',
  AuthController.registerForEo,
);

AuthsRoute.post('/login', AuthController.login);

AuthsRoute.get('/me', authenticate, AuthController.me);

// FEATURE 2 - NOMOR 2: Change Password Customer dan EO
AuthsRoute.patch(
  '/change-password',
  authenticate,
  authorize(['CUSTOMER', 'EO']),
  AuthController.changePassword,
);
