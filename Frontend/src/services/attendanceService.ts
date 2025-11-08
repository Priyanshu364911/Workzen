import { apiClient } from './api';

export interface AttendanceRecord {
  _id: string;
  userId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  totalHours?: number;
  status: 'Present' | 'Absent' | 'Half Day' | 'Late';
  notes?: string;
  user?: {
    name: string;
    email: string;
    department: string;
    position: string;
  };
}

export interface AttendanceStatus {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  attendance?: AttendanceRecord;
}

export interface AttendanceSummary {
  summary: Array<{
    _id: string;
    count: number;
    totalHours: number;
  }>;
  totalDays: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface AttendanceFilters {
  userId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class AttendanceService {
  /**
   * Check in attendance
   */
  static async checkIn(data: { date?: string; notes?: string } = {}): Promise<{
    message: string;
    attendance: AttendanceRecord;
  }> {
    const response = await apiClient.post<{
      message: string;
      attendance: AttendanceRecord;
    }>('/attendance/checkin', data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Check-in failed');
  }

  /**
   * Check out attendance
   */
  static async checkOut(data: { date?: string; notes?: string } = {}): Promise<{
    message: string;
    attendance: AttendanceRecord;
  }> {
    const response = await apiClient.post<{
      message: string;
      attendance: AttendanceRecord;
    }>('/attendance/checkout', data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Check-out failed');
  }

  /**
   * Get current attendance status
   */
  static async getCurrentStatus(): Promise<AttendanceStatus> {
    const response = await apiClient.get<AttendanceStatus>('/attendance/status');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to get attendance status');
  }

  /**
   * Get attendance logs with filters
   */
  static async getAttendanceLogs(filters: AttendanceFilters = {}): Promise<{
    attendance: AttendanceRecord[];
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
      attendance: AttendanceRecord[];
      pagination: any;
    }>(`/attendance/logs?${queryParams.toString()}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch attendance logs');
  }

  /**
   * Get attendance by ID
   */
  static async getAttendanceById(id: string): Promise<AttendanceRecord> {
    const response = await apiClient.get<{ attendance: AttendanceRecord }>(`/attendance/${id}`);
    
    if (response.success && response.data) {
      return response.data.attendance;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch attendance record');
  }

  /**
   * Get user attendance
   */
  static async getUserAttendance(userId: string, filters: Omit<AttendanceFilters, 'userId'> = {}): Promise<{
    attendance: AttendanceRecord[];
    pagination: any;
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await apiClient.get<{
      attendance: AttendanceRecord[];
      pagination: any;
    }>(`/attendance/user/${userId}?${queryParams.toString()}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch user attendance');
  }

  /**
   * Get attendance summary
   */
  static async getAttendanceSummary(params: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<AttendanceSummary> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await apiClient.get<AttendanceSummary>(`/attendance/summary?${queryParams.toString()}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch attendance summary');
  }

  /**
   * Create manual attendance record (Admin/HR only)
   */
  static async createManualAttendance(data: {
    userId: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    status: string;
    notes?: string;
  }): Promise<{
    message: string;
    attendance: AttendanceRecord;
  }> {
    const response = await apiClient.post<{
      message: string;
      attendance: AttendanceRecord;
    }>('/attendance/manual', data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to create manual attendance');
  }

  /**
   * Update attendance record
   */
  static async updateAttendance(id: string, data: {
    checkIn?: string;
    checkOut?: string;
    status?: string;
    notes?: string;
  }): Promise<{
    message: string;
    attendance: AttendanceRecord;
  }> {
    const response = await apiClient.put<{
      message: string;
      attendance: AttendanceRecord;
    }>(`/attendance/${id}`, data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to update attendance');
  }

  /**
   * Delete attendance record
   */
  static async deleteAttendance(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/attendance/${id}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to delete attendance');
  }

  /**
   * Generate attendance report
   */
  static async generateReport(params: {
    startDate: string;
    endDate: string;
    userId?: string;
    department?: string;
    status?: string;
    format?: 'json' | 'csv';
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await apiClient.get(`/attendance/reports/generate?${queryParams.toString()}`);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to generate report');
  }

  /**
   * Get attendance statistics
   */
  static async getStats(params: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await apiClient.get(`/attendance/reports/stats?${queryParams.toString()}`);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch attendance stats');
  }
}

export default AttendanceService;