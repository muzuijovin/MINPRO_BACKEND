
import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const authRoute = Router();

authRoute.post('/register', AuthController.register);
authRoute.post('/login', AuthController.login);
authRoute.get('/me', authenticate, AuthController.me);

export default authRoute;
