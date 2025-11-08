import User from '../models/User';
import Attendance from '../models/Attendance';
import Leave from '../models/Leave';
import Payroll from '../models/Payroll';
import LeaveBalance from '../models/LeaveBalance';

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
   * Get comprehensive dashboard statistics
   */
  static async getDashboardStats(userRole: string, userId?: string): Promise<DashboardStats> {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // User statistics (Admin/HR only, or limited for others)
    let userStats;
    if (['Admin', 'HR Officer'].includes(userRole)) {
      userStats = await DashboardService.getUserStats();
    } else {
      userStats = {
        total: 1,
        active: 1,
        byRole: [],
        byDepartment: []
      };
    }

    // Attendance statistics
    let attendanceStats;
    if (['Admin', 'HR Officer'].includes(userRole)) {
      attendanceStats = await DashboardService.getAttendanceStats(startOfToday, startOfMonth, endOfMonth);
    } else {
      attendanceStats = await DashboardService.getUserAttendanceStats(userId!, startOfToday, startOfMonth, endOfMonth);
    }

    // Leave statistics
    let leaveStats;
    if (['Admin', 'HR Officer', 'Payroll Officer'].includes(userRole)) {
      leaveStats = await DashboardService.getLeaveStats(startOfMonth, endOfMonth);
    } else {
      leaveStats = await DashboardService.getUserLeaveStats(userId!, startOfMonth, endOfMonth);
    }

    // Payroll statistics
    let payrollStats;
    if (['Admin', 'Payroll Officer'].includes(userRole)) {
      payrollStats = await DashboardService.getPayrollStats(currentMonth);
    } else {
      payrollStats = await DashboardService.getUserPayrollStats(userId!, currentMonth);
    }

    return {
      users: userStats,
      attendance: attendanceStats,
      leaves: leaveStats,
      payroll: payrollStats
    };
  }

  /**
   * Get user statistics
   */
  private static async getUserStats() {
    const [totalUsers, activeUsers, roleStats, departmentStats] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $project: { role: '$_id', count: 1, _id: 0 } }
      ]),
      User.aggregate([
        { $match: { isActive: true, department: { $exists: true, $nin: [null, ''] } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $project: { department: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } }
      ])
    ]);

    return {
      total: totalUsers,
      active: activeUsers,
      byRole: roleStats,
      byDepartment: departmentStats
    };
  }

  /**
   * Get attendance statistics for all users
   */
  private static async getAttendanceStats(today: Date, startOfMonth: Date, endOfMonth: Date) {
    const [todayStats, monthlyStats] = await Promise.all([
      Attendance.aggregate([
        { $match: { date: today } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Attendance.aggregate([
        { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const todayTotal = todayStats.reduce((sum, stat) => sum + stat.count, 0);
    const monthlyTotal = monthlyStats.reduce((sum, stat) => sum + stat.count, 0);

    // Calculate average attendance for the month
    const daysInMonth = endOfMonth.getDate();
    const averageAttendance = monthlyTotal > 0 ? Math.round((monthlyTotal / daysInMonth) * 100) / 100 : 0;

    return {
      today: {
        present: todayStats.find(s => s._id === 'Present')?.count || 0,
        absent: todayStats.find(s => s._id === 'Absent')?.count || 0,
        late: todayStats.find(s => s._id === 'Late')?.count || 0,
        total: todayTotal
      },
      thisMonth: {
        totalRecords: monthlyTotal,
        averageAttendance,
        byStatus: monthlyStats.map(stat => ({ status: stat._id, count: stat.count }))
      }
    };
  }

  /**
   * Get attendance statistics for a specific user
   */
  private static async getUserAttendanceStats(userId: string, today: Date, startOfMonth: Date, endOfMonth: Date) {
    const [todayRecord, monthlyStats] = await Promise.all([
      Attendance.findOne({ userId, date: today }),
      Attendance.aggregate([
        { $match: { userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const monthlyTotal = monthlyStats.reduce((sum, stat) => sum + stat.count, 0);
    const daysInMonth = endOfMonth.getDate();
    const averageAttendance = monthlyTotal > 0 ? Math.round((monthlyTotal / daysInMonth) * 100) / 100 : 0;

    return {
      today: {
        present: todayRecord?.status === 'Present' ? 1 : 0,
        absent: todayRecord ? 0 : 1,
        late: todayRecord?.status === 'Late' ? 1 : 0,
        total: 1
      },
      thisMonth: {
        totalRecords: monthlyTotal,
        averageAttendance,
        byStatus: monthlyStats.map(stat => ({ status: stat._id, count: stat.count }))
      }
    };
  }

  /**
   * Get leave statistics for all users
   */
  private static async getLeaveStats(startOfMonth: Date, endOfMonth: Date) {
    const [pendingLeaves, monthlyLeaves, leavesByType] = await Promise.all([
      Leave.countDocuments({ status: 'Pending' }),
      Leave.aggregate([
        {
          $match: {
            appliedAt: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Leave.aggregate([
        {
          $match: {
            appliedAt: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);

    const monthlyTotal = monthlyLeaves.reduce((sum, leave) => sum + leave.count, 0);

    return {
      pending: pendingLeaves,
      thisMonth: {
        approved: monthlyLeaves.find(l => l._id === 'Approved')?.count || 0,
        rejected: monthlyLeaves.find(l => l._id === 'Rejected')?.count || 0,
        total: monthlyTotal
      },
      byType: leavesByType.map(leave => ({ type: leave._id, count: leave.count }))
    };
  }

  /**
   * Get leave statistics for a specific user
   */
  private static async getUserLeaveStats(userId: string, startOfMonth: Date, endOfMonth: Date) {
    const [pendingLeaves, monthlyLeaves, leavesByType] = await Promise.all([
      Leave.countDocuments({ userId, status: 'Pending' }),
      Leave.aggregate([
        {
          $match: {
            userId,
            appliedAt: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Leave.aggregate([
        {
          $match: {
            userId,
            appliedAt: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);

    const monthlyTotal = monthlyLeaves.reduce((sum, leave) => sum + leave.count, 0);

    return {
      pending: pendingLeaves,
      thisMonth: {
        approved: monthlyLeaves.find(l => l._id === 'Approved')?.count || 0,
        rejected: monthlyLeaves.find(l => l._id === 'Rejected')?.count || 0,
        total: monthlyTotal
      },
      byType: leavesByType.map(leave => ({ type: leave._id, count: leave.count }))
    };
  }

  /**
   * Get payroll statistics for all users
   */
  private static async getPayrollStats(currentMonth: string) {
    const lastMonth = DashboardService.getPreviousMonth(currentMonth);

    const [currentMonthStats, lastMonthStats] = await Promise.all([
      Payroll.aggregate([
        { $match: { month: currentMonth } },
        {
          $group: {
            _id: null,
            processed: { $sum: 1 },
            totalGross: { $sum: '$gross' },
            totalNet: { $sum: '$netPay' },
            averageSalary: { $avg: '$netPay' }
          }
        }
      ]),
      Payroll.aggregate([
        { $match: { month: lastMonth } },
        {
          $group: {
            _id: null,
            processed: { $sum: 1 },
            totalNet: { $sum: '$netPay' }
          }
        }
      ])
    ]);

    const current = currentMonthStats[0] || { processed: 0, totalGross: 0, totalNet: 0, averageSalary: 0 };
    const last = lastMonthStats[0] || { processed: 0, totalNet: 0 };

    return {
      thisMonth: {
        processed: current.processed,
        totalGross: Math.round(current.totalGross),
        totalNet: Math.round(current.totalNet),
        averageSalary: Math.round(current.averageSalary)
      },
      lastMonth: {
        processed: last.processed,
        totalNet: Math.round(last.totalNet)
      }
    };
  }

  /**
   * Get payroll statistics for a specific user
   */
  private static async getUserPayrollStats(userId: string, currentMonth: string) {
    const lastMonth = DashboardService.getPreviousMonth(currentMonth);

    const [currentMonthPayroll, lastMonthPayroll] = await Promise.all([
      Payroll.findOne({ userId, month: currentMonth }),
      Payroll.findOne({ userId, month: lastMonth })
    ]);

    return {
      thisMonth: {
        processed: currentMonthPayroll ? 1 : 0,
        totalGross: currentMonthPayroll ? currentMonthPayroll.gross : 0,
        totalNet: currentMonthPayroll ? currentMonthPayroll.netPay : 0,
        averageSalary: currentMonthPayroll ? currentMonthPayroll.netPay : 0
      },
      lastMonth: {
        processed: lastMonthPayroll ? 1 : 0,
        totalNet: lastMonthPayroll ? lastMonthPayroll.netPay : 0
      }
    };
  }

  /**
   * Get chart data for dashboard visualizations
   */
  static async getChartData(userRole: string, userId?: string): Promise<ChartData> {
    const today = new Date();
    
    // Get data for the last 30 days for attendance trend
    const attendanceTrend = await DashboardService.getAttendanceTrend(userRole, userId);
    
    // Get data for the last 12 months for leave and payroll trends
    const leaveTrend = await DashboardService.getLeaveTrend(userRole, userId);
    const payrollTrend = await DashboardService.getPayrollTrend(userRole, userId);
    
    // Get department distribution (Admin/HR only)
    let departmentDistribution: Array<{ department: string; count: number; percentage: number }> = [];
    if (['Admin', 'HR Officer'].includes(userRole)) {
      departmentDistribution = await DashboardService.getDepartmentDistribution();
    }

    return {
      attendanceTrend,
      leaveTrend,
      payrollTrend,
      departmentDistribution
    };
  }

  /**
   * Get attendance trend for the last 30 days
   */
  private static async getAttendanceTrend(userRole: string, userId?: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29); // Last 30 days

    const matchStage: any = {
      date: { $gte: startDate, $lte: endDate }
    };

    if (!['Admin', 'HR Officer'].includes(userRole) && userId) {
      matchStage.userId = userId;
    }

    const attendanceData = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing dates and format data
    const trend = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = attendanceData.find(d => d._id === dateStr);
      const statuses = dayData?.statuses || [];
      
      trend.push({
        date: dateStr,
        present: statuses.find((s: any) => s.status === 'Present')?.count || 0,
        absent: statuses.find((s: any) => s.status === 'Absent')?.count || 0,
        late: statuses.find((s: any) => s.status === 'Late')?.count || 0
      });
    }

    return trend;
  }

  /**
   * Get leave trend for the last 12 months
   */
  private static async getLeaveTrend(userRole: string, userId?: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11); // Last 12 months

    const matchStage: any = {
      appliedAt: { $gte: startDate, $lte: endDate },
      status: 'Approved'
    };

    if (!['Admin', 'HR Officer', 'Payroll Officer'].includes(userRole) && userId) {
      matchStage.userId = userId;
    }

    const leaveData = await Leave.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$appliedAt' } },
            type: '$type'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.month',
          types: {
            $push: {
              type: '$_id.type',
              count: '$count'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing months and format data
    const trend = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthData = leaveData.find(d => d._id === monthStr);
      const types = monthData?.types || [];
      
      trend.push({
        month: monthStr,
        sick: types.find((t: any) => t.type === 'Sick')?.count || 0,
        casual: types.find((t: any) => t.type === 'Casual')?.count || 0,
        earned: types.find((t: any) => t.type === 'Earned')?.count || 0
      });
    }

    return trend;
  }

  /**
   * Get payroll trend for the last 12 months
   */
  private static async getPayrollTrend(userRole: string, userId?: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11); // Last 12 months

    const matchStage: any = {};

    if (!['Admin', 'Payroll Officer'].includes(userRole) && userId) {
      matchStage.userId = userId;
    }

    const payrollData = await Payroll.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$month',
          totalGross: { $sum: '$gross' },
          totalNet: { $sum: '$netPay' },
          employeeCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing months and format data
    const trend = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthData = payrollData.find(d => d._id === monthStr);
      
      trend.push({
        month: monthStr,
        totalGross: monthData?.totalGross || 0,
        totalNet: monthData?.totalNet || 0,
        employeeCount: monthData?.employeeCount || 0
      });
    }

    return trend;
  }

  /**
   * Get department distribution
   */
  private static async getDepartmentDistribution() {
    const departmentData = await User.aggregate([
      { $match: { isActive: true, department: { $exists: true, $nin: [null, ''] } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const totalEmployees = departmentData.reduce((sum, dept) => sum + dept.count, 0);

    return departmentData.map(dept => ({
      department: dept._id,
      count: dept.count,
      percentage: totalEmployees > 0 ? Math.round((dept.count / totalEmployees) * 100) : 0
    }));
  }

  /**
   * Get recent activities (for activity feed)
   */
  static async getRecentActivities(userRole: string, userId?: string, limit: number = 10) {
    const activities: any[] = [];

    // Recent leave applications
    const matchStage: any = {};
    if (!['Admin', 'HR Officer', 'Payroll Officer'].includes(userRole) && userId) {
      matchStage.userId = userId;
    }

    const recentLeaves = await Leave.find(matchStage)
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ appliedAt: -1 })
      .limit(limit);

    recentLeaves.forEach(leave => {
      activities.push({
        type: 'leave',
        action: leave.status === 'Pending' ? 'applied' : leave.status.toLowerCase(),
        user: leave.userId,
        details: `${leave.type} leave from ${leave.from.toDateString()} to ${leave.to.toDateString()}`,
        timestamp: leave.appliedAt,
        status: leave.status
      });
    });

    // Recent payroll processing (Admin/Payroll Officer only)
    if (['Admin', 'Payroll Officer'].includes(userRole)) {
      const recentPayroll = await Payroll.find({ status: 'Processed' })
        .populate('userId', 'name email')
        .populate('processedBy', 'name email')
        .sort({ processedAt: -1 })
        .limit(5);

      recentPayroll.forEach(payroll => {
        activities.push({
          type: 'payroll',
          action: 'processed',
          user: payroll.userId,
          details: `Payroll for ${payroll.month} - ₹${payroll.netPay}`,
          timestamp: payroll.processedAt,
          status: payroll.status
        });
      });
    }

    // Sort all activities by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Helper function to get previous month string
   */
  private static getPreviousMonth(monthStr: string): string {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}

export default DashboardService;