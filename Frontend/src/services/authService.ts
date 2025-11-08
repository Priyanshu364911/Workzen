import apiClient from './api';
import { User } from '@/context/AuthContext';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'HR Officer' | 'Payroll Officer' | 'Employee';
  basicSalary: number;
  department?: string;
  position?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export class AuthService {
  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      // Store token in localStorage
      localStorage.setItem('workzen_token', response.data.token);
      localStorage.setItem('workzen_user', JSON.stringify(response.data.user));
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Login failed');
  }

  /**
   * Register new user (Admin only)
   */
  static async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Registration failed');
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('workzen_token');
      localStorage.removeItem('workzen_user');
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<User> {
    const response = await apiClient.get<{ user: User }>('/auth/profile');
    
    if (response.success && response.data) {
      return response.data.user;
    }
    
    throw new Error(response.error?.message || 'Failed to get profile');
  }

  /**
   * Update user profile
   */
  static async updateProfile(profileData: Partial<User>): Promise<User> {
    const response = await apiClient.put<{ user: User }>('/auth/profile', profileData);
    
    if (response.success && response.data) {
      // Update stored user data
      localStorage.setItem('workzen_user', JSON.stringify(response.data.user));
      return response.data.user;
    }
    
    throw new Error(response.error?.message || 'Failed to update profile');
  }

  /**
   * Change password
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword: newPassword
    });
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to change password');
    }
  }

  /**
   * Verify token and get user info
   */
  static async verifyToken(): Promise<User> {
    const response = await apiClient.get<{ user: User }>('/auth/verify');
    
    if (response.success && response.data) {
      return response.data.user;
    }
    
    throw new Error(response.error?.message || 'Token verification failed');
  }

  /**
   * Get stored user from localStorage
   */
  static getStoredUser(): User | null {
    try {
      const storedUser = localStorage.getItem('workzen_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  }

  /**
   * Get stored token from localStorage
   */
  static getStoredToken(): string | null {
    return localStorage.getItem('workzen_token');
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = AuthService.getStoredToken();
    const user = AuthService.getStoredUser();
    return !!(token && user);
  }
}

export default AuthService;