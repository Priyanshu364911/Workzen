import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../middleware/errorHandler';
import UserService from '../services/userService';

export class UserController {
  /**
   * Get all users with pagination and filtering
   * GET /api/users
   */
  static getUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserService.getUsers(req.query as any);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: result.users,
        pagination: result.pagination
      }
    });
  });

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  static getUserById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserService.getUserById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        user
      }
    });
  });

  /**
   * Create new user (Admin only)
   * POST /api/users
   */
  static createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user
      }
    });
  });

  /**
   * Update user by ID (Admin/HR)
   * PUT /api/users/:id
   */
  static updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserService.updateUser(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user
      }
    });
  });

  /**
   * Delete user by ID (Admin only)
   * DELETE /api/users/:id
   */
  static deleteUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await UserService.deleteUser(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  });

  /**
   * Deactivate user (soft delete)
   * PUT /api/users/:id/deactivate
   */
  static deactivateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserService.deactivateUser(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      data: {
        user
      }
    });
  });

  /**
   * Activate user
   * PUT /api/users/:id/activate
   */
  static activateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserService.activateUser(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User activated successfully',
      data: {
        user
      }
    });
  });

  /**
   * Update user salary (Admin/Payroll Officer)
   * PUT /api/users/:id/salary
   */
  static updateUserSalary = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { basicSalary } = req.body;
    const user = await UserService.updateUserSalary(req.params.id, basicSalary);

    res.status(200).json({
      success: true,
      message: 'User salary updated successfully',
      data: {
        user
      }
    });
  });

  /**
   * Get users by role
   * GET /api/users/role/:role
   */
  static getUsersByRole = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const users = await UserService.getUsersByRole(req.params.role as any);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users
      }
    });
  });

  /**
   * Get users by department
   * GET /api/users/department/:department
   */
  static getUsersByDepartment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const users = await UserService.getUsersByDepartment(req.params.department);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users
      }
    });
  });

  /**
   * Get user statistics
   * GET /api/users/stats
   */
  static getUserStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const stats = await UserService.getUserStats();

    res.status(200).json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        stats
      }
    });
  });

  /**
   * Search users
   * GET /api/users/search?q=searchTerm&limit=10
   */
  static searchUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { q: searchTerm, limit = 10 } = req.query;
    
    if (!searchTerm) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Search term is required'
        }
      });
      return;
    }

    const users = await UserService.searchUsers(searchTerm as string, Number(limit));

    res.status(200).json({
      success: true,
      message: 'Search results retrieved successfully',
      data: {
        users
      }
    });
  });
}

export default UserController;