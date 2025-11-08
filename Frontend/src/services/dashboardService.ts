import { apiClient } from './api';

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    byRole: Array<{ role: string; count: number }>;
    byDepartment: Array<{ department: string; count: number }>;
  };
  attendance: {
    today: {
      present: number;
      absent: number;
      late: number;
      total: number;
    };
    thisMonth: {
      totalRecords: number;
      averageAttendance: number;
      byStatus: Array<{ status: string; count: number }>;
    };
  };
  leaves: {
    pending: number;
    thisMonth: {
      approved: number;
      rejected: number;
      total: number;
    };
    byType: Array<{ type: string; count: number }>;
  };
  payroll: {
    thisMonth: {
      processed: number;
      totalGross: number;
      totalNet: number;
      averageSalary: number;
    };
    lastMonth: {
      processed: number;
      totalNet: number;
    };
  };
}

export interface ChartData {
  attendanceTrend: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
  }>;
  leaveTrend: Array<{
    month: string;
    sick: number;
    casual: number;
    earned: number;
  }>;
  payrollTrend: Array<{
    month: string;
    totalGross: number;
    totalNet: number;
    employeeCount: number;
  }>;
  departmentDistribution: Array<{
    department: string;
    count: number;
    percentage: number;
  }>;
}

export class DashboardService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<{ stats: DashboardStats }>('/dashboard/stats');
    
    if (response.success && response.data) {
      return response.data.stats;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch dashboard stats');
  }

  /**
   * Get chart data for dashboard
   */
  static async getChartData(): Promise<ChartData> {
    const response = await apiClient.get<{ charts: ChartData }>('/dashboard/charts');
    
    if (response.success && response.data) {
      return response.data.charts;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch chart data');
  }

  /**
   * Get recent activities
   */
  static async getRecentActivities(limit: number = 10): Promise<any[]> {
    const response = await apiClient.get<{ activities: any[] }>(`/dashboard/activities?limit=${limit}`);
    
    if (response.success && response.data) {
      return response.data.activities;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch recent activities');
  }

  /**
   * Get all dashboard data in one call
   */
  static async getDashboardData(): Promise<{
    stats: DashboardStats;
    charts: ChartData;
    activities: any[];
  }> {
    const response = await apiClient.get<{
      stats: DashboardStats;
      charts: ChartData;
      activities: any[];
    }>('/dashboard');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch dashboard data');
  }
}

export default DashboardService;