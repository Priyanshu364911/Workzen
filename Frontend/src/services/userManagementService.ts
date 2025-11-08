import { apiClient } from './api';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'HR Officer' | 'Payroll Officer' | 'Employee';
  basicSalary: number;
  department?: string;
  position?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'Admin' | 'HR Officer' | 'Payroll Officer' | 'Employee';
  basicSalary: number;
  department?: string;
  position?: string;
  joinDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class UserManagementService {
  /**
   * Create a new user (Admin only) - doesn't affect current session
   */
  static async createUser(userData: CreateUserData): Promise<User> {
    const response = await apiClient.post<{ user: User }>('/users', userData);
    
    if (response.success && response.data) {
      return response.data.user;
    }
    
    throw new Error(response.error?.message || 'Failed to create user');
  }

  /**
   * Get all users with pagination and filters
   */
  static async getUsers(params: {
    search?: string;
    role?: string;
    department?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    users: User[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await apiClient.get<{
      users: User[];
      pagination: any;
    }>(`/users?${queryParams.toString()}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch users');
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<{ user: User }>(`/users/${id}`);
    
    if (response.success && response.data) {
      return response.data.user;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch user');
  }

  /**
   * Update user
   */
  static async updateUser(id: string, userData: {
    name?: string;
    role?: string;
    basicSalary?: number;
    department?: string;
    position?: string;
    isActive?: boolean;
  }): Promise<User> {
    const response = await apiClient.put<{ user: User }>(`/users/${id}`, userData);
    
    if (response.success && response.data) {
      return response.data.user;
    }
    
    throw new Error(response.error?.message || 'Failed to update user');
  }

  /**
   * Delete user
   */
  static async deleteUser(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/users/${id}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to delete user');
  }

  /**
   * Deactivate user
   */
  static async deactivateUser(id: string): Promise<User> {
    const response = await apiClient.put<{ user: User }>(`/users/${id}/deactivate`);
    
    if (response.success && response.data) {
      return response.data.user;
    }
    
    throw new Error(response.error?.message || 'Failed to deactivate user');
  }

  /**
   * Activate user
   */
  static async activateUser(id: string): Promise<User> {
    const response = await apiClient.put<{ user: User }>(`/users/${id}/activate`);
    
    if (response.success && response.data) {
      return response.data.user;
    }
    
    throw new Error(response.error?.message || 'Failed to activate user');
  }

  /**
   * Update user salary
   */
  static async updateUserSalary(id: string, basicSalary: number): Promise<User> {
    const response = await apiClient.put<{ user: User }>(`/users/${id}/salary`, { basicSalary });
    
    if (response.success && response.data) {
      return response.data.user;
    }
    
    throw new Error(response.error?.message || 'Failed to update user salary');
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: string): Promise<User[]> {
    const response = await apiClient.get<{ users: User[] }>(`/users/role/${role}`);
    
    if (response.success && response.data) {
      return response.data.users;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch users by role');
  }

  /**
   * Get users by department
   */
  static async getUsersByDepartment(department: string): Promise<User[]> {
    const response = await apiClient.get<{ users: User[] }>(`/users/department/${department}`);
    
    if (response.success && response.data) {
      return response.data.users;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch users by department');
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<{
    overview: {
      totalUsers: number;
      activeUsers: number;
      inactiveUsers: number;
    };
    byRole: Array<{ _id: string; count: number }>;
    byDepartment: Array<{ _id: string; count: number }>;
  }> {
    const response = await apiClient.get<{
      stats: {
        overview: any;
        byRole: any[];
        byDepartment: any[];
      };
    }>('/users/stats');
    
    if (response.success && response.data) {
      return response.data.stats;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch user stats');
  }

  /**
   * Search users
   */
  static async searchUsers(searchTerm: string, limit: number = 10): Promise<User[]> {
    const response = await apiClient.get<{ users: User[] }>(`/users/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`);
    
    if (response.success && response.data) {
      return response.data.users;
    }
    
    throw new Error(response.error?.message || 'Failed to search users');
  }
}

export default UserManagementService;