import { Request, Response, NextFunction } from 'express';
import { catchAsync, AppError } from './errorHandler';
import JwtUtils from '../utils/jwt';
import User, { IUser } from '../models/User';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Middleware to authenticate user using JWT token
 */
export const authenticate = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // 1) Get token from header
  const token = JwtUtils.extractTokenFromHeader(req.headers.authorization);
  
  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // 2) Verify token
  let decoded;
  try {
    decoded = JwtUtils.verifyToken(token);
  } catch (error) {
    return next(new AppError('Invalid token. Please log in again!', 401));
  }

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  // 4) Check if user is active
  if (!currentUser.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact administrator.', 401));
  }

  // 5) Grant access to protected route
  req.user = currentUser;
  next();
});

/**
 * Middleware to restrict access to specific roles
 */
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

/**
 * Optional authentication middleware - doesn't throw error if no token
 */
export const optionalAuth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const token = JwtUtils.extractTokenFromHeader(req.headers.authorization);
  
  if (token) {
    try {
      const decoded = JwtUtils.verifyToken(token);
      const currentUser = await User.findById(decoded.id);
      
      if (currentUser && currentUser.isActive) {
        req.user = currentUser;
      }
    } catch (error) {
      // Silently fail for optional auth
    }
  }
  
  next();
});

/**
 * Middleware to check if user owns the resource or has admin/HR privileges
 */
export const checkResourceOwnership = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    const currentUserId = req.user._id.toString();
    const userRole = req.user.role;

    // Admin and HR Officer can access any resource
    if (userRole === 'Admin' || userRole === 'HR Officer') {
      return next();
    }

    // Payroll Officer can access payroll-related resources
    if (userRole === 'Payroll Officer' && req.baseUrl.includes('payroll')) {
      return next();
    }

    // User can only access their own resources
    if (resourceUserId && resourceUserId !== currentUserId) {
      return next(new AppError('You can only access your own resources', 403));
    }

    next();
  };
};