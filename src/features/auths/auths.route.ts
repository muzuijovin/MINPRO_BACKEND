
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
