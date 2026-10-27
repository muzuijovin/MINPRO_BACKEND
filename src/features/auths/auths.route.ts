import { Router } from 'express';
import { AuthController } from './auths.controller';
import { authenticate } from '../../middleware/auths.middleware';

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

// tanpa authenticate: token yang sudah expired juga tetap bisa dihapus
AuthsRoute.post('/logout', AuthController.logout);

// AuthsRoute.get(
//   '/test-customer',
//   authenticate,
//   authorize(['CUSTOMER']),
//   (req, res) => {
//     res.status(200).json({
//       success: true,
//       message: 'Customer access granted',
//       data: {},
//     });
//   },
// );

// AuthsRoute.get(
//   '/test-eo',
//   authenticate,
//   authorize(['EO']),
//   (req, res) => {
//     res.status(200).json({
//       success: true,
//       message: 'EO access granted',
//       data: {},
//     });
//   },
// );
