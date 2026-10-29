
import { Router } from 'express';
import { AuthController } from './auths.controller';
import { authenticate } from '../../middleware/auths.middleware';

export const AuthsRoute = Router();

// FEATURE 2 - NOMOR 1: Register akun Customer
AuthsRoute.post(
  '/register/customer',
  AuthController.registerForCustomer,
);

// FEATURE 2 - NOMOR 1: Register akun Event Organizer (EO)
AuthsRoute.post(
  '/register/eo',
  AuthController.registerForEo,
);

// FEATURE 2 - NOMOR 1: Login Customer dan EO
AuthsRoute.post('/login', AuthController.login);

// FEATURE 2 - NOMOR 1: Memeriksa sesi login Customer dan EO
AuthsRoute.get('/me', authenticate, AuthController.me);

// FEATURE 2 - NOMOR 1: Logout Customer dan EO
// tanpa authenticate: token yang sudah expired juga tetap bisa dihapus
AuthsRoute.post('/logout', AuthController.logout);
