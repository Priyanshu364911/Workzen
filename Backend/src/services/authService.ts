import User, { IUser, Role } from '../models/User';
import JwtUtils from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: Role;
  basicSalary: number;
  department?: string;
  position?: string;
  joinDate?: Date;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: IUser;
}

export class AuthService {
  /**
   * Login user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    // 1) Check if email and password exist
    if (!email || !password) {
      throw new AppError('Please provide email and password!', 400);
    }

    // 2) Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Incorrect email or password', 401);
    }

    // 3) Check if user is active
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact administrator.', 401);
    }

    // 4) Generate JWT token
    const token = JwtUtils.generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    // 5) Remove password from output
    user.password = undefined as any;

    return {
      success: true,
      token,
      user
    };
  }

  /**
   * Register new user (Admin only)
   */
  static async register(userData: RegisterData): Promise<AuthResponse> {
    // 1) Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // 2) Create new user
    const newUser = await User.create(userData);

    // 3) Generate JWT token
    const token = JwtUtils.generateToken({
      id: newUser._id,
      email: newUser.email,
      role: newUser.role
    });

    return {
      success: true,
      token,
      user: newUser
    };
  }

  /**
   * Get user profile by ID
   */
  static async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isActive) {
      throw new AppError('User account is deactivated', 401);
    }

    return user;
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updateData: Partial<IUser>): Promise<IUser> {
    // Remove fields that shouldn't be updated via this method
    const { password, email, role, basicSalary, isActive, ...allowedUpdates } = updateData;

    const user = await User.findByIdAndUpdate(
      userId,
      allowedUpdates,
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
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // 1) Get user with password
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // 2) Check if current password is correct
    if (!(await user.comparePassword(currentPassword))) {
      throw new AppError('Your current password is incorrect', 400);
    }

    // 3) Update password
    user.password = newPassword;
    await user.save();
  }

  /**
   * Deactivate user account
   */
  static async deactivateUser(userId: string): Promise<void> {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }
  }

  /**
   * Activate user account
   */
  static async activateUser(userId: string): Promise<void> {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }
  }

  /**
   * Verify JWT token and return user
   */
  static async verifyToken(token: string): Promise<IUser> {
    try {
      const decoded = JwtUtils.verifyToken(token);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.isActive) {
        throw new AppError('User account is deactivated', 401);
      }

      return user;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }
}

export default AuthService;