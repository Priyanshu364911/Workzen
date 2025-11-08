import User, { IUser, Role } from '../models/User';
import { AppError } from '../middleware/errorHandler';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: Role;
  basicSalary: number;
  department?: string;
  position?: string;
  joinDate?: Date;
}

export interface UpdateUserData {
  name?: string;
  role?: Role;
  basicSalary?: number;
  department?: string;
  position?: string;
  isActive?: boolean;
}

export interface GetUsersQuery {
  page: number;
  limit: number;
  search?: string;
  role?: Role;
  department?: string;
  isActive?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedUsers {
  users: IUser[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class UserService {
  /**
   * Get all users with pagination and filtering
   */
  static async getUsers(query: GetUsersQuery): Promise<PaginatedUsers> {
    const {
      page,
      limit,
      search,
      role,
      department,
      isActive,
      sortBy,
      sortOrder
    } = query;

    // Build filter object
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (department) {
      filter.department = { $regex: department, $options: 'i' };
    }

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    return {
      users: users.map(user => user as unknown as IUser),
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Create new user (Admin only)
   */
  static async createUser(userData: CreateUserData): Promise<IUser> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Create new user
    const newUser = await User.create(userData);
    return newUser;
  }

  /**
   * Update user by ID (Admin/HR)
   */
  static async updateUser(userId: string, updateData: UpdateUserData): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Delete user by ID (Admin only)
   */
  static async deleteUser(userId: string): Promise<void> {
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
  }

  /**
   * Deactivate user (soft delete)
   */
  static async deactivateUser(userId: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Activate user
   */
  static async activateUser(userId: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Update user salary (Admin/Payroll Officer)
   */
  static async updateUserSalary(userId: string, basicSalary: number): Promise<IUser> {
    if (basicSalary <= 0) {
      throw new AppError('Basic salary must be a positive number', 400);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { basicSalary },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: Role): Promise<IUser[]> {
    const users = await User.find({ role, isActive: true }).sort({ name: 1 });
    return users;
  }

  /**
   * Get users by department
   */
  static async getUsersByDepartment(department: string): Promise<IUser[]> {
    const users = await User.find({ 
      department: { $regex: department, $options: 'i' }, 
      isActive: true 
    }).sort({ name: 1 });
    return users;
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<any> {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          inactiveUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
          }
        }
      }
    ]);

    const roleStats = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const departmentStats = await User.aggregate([
      { 
        $match: { 
          isActive: true, 
          department: { $exists: true, $nin: [null, ''] } 
        } 
      },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return {
      overview: stats[0] || { totalUsers: 0, activeUsers: 0, inactiveUsers: 0 },
      byRole: roleStats,
      byDepartment: departmentStats
    };
  }

  /**
   * Search users by name or email
   */
  static async searchUsers(searchTerm: string, limit: number = 10): Promise<IUser[]> {
    const users = await User.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      ]
    })
    .limit(limit)
    .sort({ name: 1 });

    return users;
  }
}

export default UserService;