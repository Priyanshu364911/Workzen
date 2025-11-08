import { apiClient } from './api';

export interface LeaveApplication {
  _id: string;
  userId: string;
  type: 'Sick' | 'Casual' | 'Earned' | 'Maternity' | 'Paternity';
  from: string;
  to: string;
  totalDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComments?: string;
  user?: {
    name: string;
    email: string;
    department: string;
    position: string;
  };
  reviewer?: {
    name: string;
    email: string;
  };
}

export interface LeaveBalance {
  _id: string;
  userId: string;
  year: number;
  sickLeave: number;
  casualLeave: number;
  earnedLeave: number;
  usedSickLeave: number;
  usedCasualLeave: number;
  usedEarnedLeave: number;
  remainingSickLeave: number;
  remainingCasualLeave: number;
  remainingEarnedLeave: number;
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
}

export interface LeaveFilters {
  userId?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class LeaveService {
  /**
   * Apply for leave
   */
  static async applyLeave(data: {
    type: string;
    from: string;
    to: string;
    reason: string;
  }): Promise<{
    message: string;
    leave: LeaveApplication;
  }> {
    const response = await apiClient.post<{
      message: string;
      leave: LeaveApplication;
    }>('/leaves/apply', data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to apply for leave');
  }

  /**
   * Get leaves with filters
   */
  static async getLeaves(filters: LeaveFilters = {}): Promise<{
    leaves: LeaveApplication[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await apiClient.get<{
      leaves: LeaveApplication[];
      pagination: any;
    }>(`/leaves?${queryParams.toString()}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch leaves');
  }

  /**
   * Get leave by ID
   */
  static async getLeaveById(id: string): Promise<LeaveApplication> {
    const response = await apiClient.get<{ leave: LeaveApplication }>(`/leaves/${id}`);
    
    if (response.success && response.data) {
      return response.data.leave;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch leave');
  }

  /**
   * Get user leaves
   */
  static async getUserLeaves(userId: string, filters: Omit<LeaveFilters, 'userId'> = {}): Promise<{
    leaves: LeaveApplication[];
    pagination: any;
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await apiClient.get<{
      leaves: LeaveApplication[];
      pagination: any;
    }>(`/leaves/user/${userId}?${queryParams.toString()}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch user leaves');
  }

  /**
   * Approve leave
   */
  static async approveLeave(id: string, reviewComments?: string): Promise<{
    message: string;
    leave: LeaveApplication;
  }> {
    const response = await apiClient.put<{
      message: string;
      leave: LeaveApplication;
    }>(`/leaves/${id}/approve`, { reviewComments });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to approve leave');
  }

  /**
   * Reject leave
   */
  static async rejectLeave(id: string, reviewComments?: string): Promise<{
    message: string;
    leave: LeaveApplication;
  }> {
    const response = await apiClient.put<{
      message: string;
      leave: LeaveApplication;
    }>(`/leaves/${id}/reject`, { reviewComments });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to reject leave');
  }

  /**
   * Update leave
   */
  static async updateLeave(id: string, data: {
    type?: string;
    from?: string;
    to?: string;
    reason?: string;
    status?: string;
    reviewComments?: string;
  }): Promise<{
    message: string;
    leave: LeaveApplication;
  }> {
    const response = await apiClient.put<{
      message: string;
      leave: LeaveApplication;
    }>(`/leaves/${id}`, data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to update leave');
  }

  /**
   * Delete leave
   */
  static async deleteLeave(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/leaves/${id}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to delete leave');
  }

  /**
   * Get leave balance
   */
  static async getLeaveBalance(params: {
    userId?: string;
    year?: number;
  } = {}): Promise<{ balance: LeaveBalance }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await apiClient.get<{ balance: LeaveBalance }>(`/leaves/balance?${queryParams.toString()}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch leave balance');
  }

  /**
   * Allocate leave balance (Admin/HR only)
   */
  static async allocateLeaveBalance(data: {
    userId: string;
    year: number;
    sickLeave?: number;
    casualLeave?: number;
    earnedLeave?: number;
  }): Promise<{
    message: string;
    balance: LeaveBalance;
  }> {
    const response = await apiClient.post<{
      message: string;
      balance: LeaveBalance;
    }>('/leaves/allocate', data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to allocate leave balance');
  }

  /**
   * Get pending leaves
   */
  static async getPendingLeaves(limit: number = 10): Promise<LeaveApplication[]> {
    const response = await apiClient.get<{ leaves: LeaveApplication[] }>(`/leaves/pending/list?limit=${limit}`);
    
    if (response.success && response.data) {
      return response.data.leaves;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch pending leaves');
  }

  /**
   * Get leave summary
   */
  static async getLeaveSummary(params: {
    userId?: string;
    year?: number;
  } = {}): Promise<{
    summary: any[];
    balance: LeaveBalance;
    year: number;
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await apiClient.get<{
      summary: any[];
      balance: LeaveBalance;
      year: number;
    }>(`/leaves/summary?${queryParams.toString()}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch leave summary');
  }

  /**
   * Get leave statistics
   */
  static async getLeaveStats(params: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await apiClient.get(`/leaves/reports/stats?${queryParams.toString()}`);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch leave stats');
  }
}

export default LeaveService;