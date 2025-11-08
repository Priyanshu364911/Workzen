import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../middleware/errorHandler';
import AuthService from '../services/authService';

export class AuthController {
  /**
   * Login user
   * POST /api/auth/login
   */
  static login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.login(req.body);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token: result.token,
        user: result.user
      }
    });
  });

  /**
   * Register new user (Admin only)
   * POST /api/auth/register
   */
  static register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token: result.token,
        user: result.user
      }
    });
  });

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  static getProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await AuthService.getProfile(req.user!._id);

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user
      }
    });
  });

  /**
   * Update current user profile
   * PUT /api/auth/profile
   */
  static updateProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await AuthService.updateProfile(req.user!._id, req.body);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user
      }
    });
  });

  /**
   * Change password
   * PUT /api/auth/change-password
   */
  static changePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword } = req.body;

    await AuthService.changePassword(req.user!._id, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  });

  /**
   * Logout user (client-side token removal)
   * POST /api/auth/logout
   */
  static logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // In a stateless JWT system, logout is handled client-side by removing the token
    // Here we just send a success response
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  /**
   * Verify token and return user info
   * GET /api/auth/verify
   */
  static verifyToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // The authenticate middleware already verified the token and attached user to req
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user
      }
    });
  });
}

export default AuthController;