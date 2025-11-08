import { Router } from 'express';
import AuthController from '../controllers/authController';
import { authenticate, restrictTo } from '../middleware/auth';
import {
  validateLogin,
  validateRegister,
  validateUpdateProfile,
  validateChangePassword
} from '../validators/authValidators';

const router = Router();

// Public routes
router.post('/login', validateLogin, AuthController.login);
router.post('/logout', AuthController.logout);

// Protected routes (require authentication)
router.use(authenticate); // All routes after this middleware require authentication

router.get('/profile', AuthController.getProfile);
router.put('/profile', validateUpdateProfile, AuthController.updateProfile);
router.put('/change-password', validateChangePassword, AuthController.changePassword);
router.get('/verify', AuthController.verifyToken);

// Admin only routes
router.post('/register', restrictTo('Admin'), validateRegister, AuthController.register);

export default router;