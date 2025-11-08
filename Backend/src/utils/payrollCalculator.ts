import Attendance from '../models/Attendance';
import Leave from '../models/Leave';
import User from '../models/User';

export interface PayrollCalculationInput {
  userId: string;
  month: string;
  basicSalary: number;
  workingDays?: number;
}

export interface PayrollCalculationResult {
  userId: string;
  month: string;
  basic: number;
  hra: number;
  gross: number;
  pf: number;
  proTax: number;
  lop: number;
  netPay: number;
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
}

export class PayrollCalculator {
  /**
   * Calculate payroll for a user for a specific month
   */
  static async calculatePayroll(input: PayrollCalculationInput): Promise<PayrollCalculationResult> {
    const { userId, month, basicSalary, workingDays = 22 } = input;

    // Parse month to get year and month number
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of month

    // Get attendance data for the month
    const attendanceRecords = await Attendance.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate present days
    const presentDays = attendanceRecords.filter(record => 
      ['Present', 'Late', 'Half Day'].includes(record.status)
    ).length;

    // Get approved leaves for the month
    const approvedLeaves = await Leave.find({
      userId,
      status: 'Approved',
      $or: [
        { from: { $gte: startDate, $lte: endDate } },
        { to: { $gte: startDate, $lte: endDate } },
        { from: { $lte: startDate }, to: { $gte: endDate } }
      ]
    });

    // Calculate paid leave days for the month
    let paidLeaveDays = 0;
    for (const leave of approvedLeaves) {
      const leaveStart = new Date(Math.max(leave.from.getTime(), startDate.getTime()));
      const leaveEnd = new Date(Math.min(leave.to.getTime(), endDate.getTime()));
      
      if (leaveStart <= leaveEnd) {
        const days = Math.ceil((leaveEnd.getTime() - leaveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        paidLeaveDays += days;
      }
    }

    // Calculate salary components
    const basic = basicSalary;
    const hra = basic * 0.4; // 40% of basic salary
    const gross = basic + hra;
    const pf = basic * 0.12; // 12% of basic salary
    const proTax = 200; // Fixed professional tax

    // Calculate LOP (Loss of Pay)
    const effectiveDays = presentDays + paidLeaveDays;
    const absentDays = Math.max(0, workingDays - effectiveDays);
    const lop = (absentDays * gross) / workingDays;

    // Calculate net pay
    const netPay = gross - pf - proTax - lop;

    return {
      userId,
      month,
      basic: Math.round(basic),
      hra: Math.round(hra),
      gross: Math.round(gross),
      pf: Math.round(pf),
      proTax,
      lop: Math.round(lop),
      netPay: Math.round(netPay),
      workingDays,
      presentDays,
      paidLeaveDays,
      unpaidLeaveDays: absentDays
    };
  }

  /**
   * Calculate payroll for multiple users
   */
  static async calculateBulkPayroll(
    userIds: string[],
    month: string,
    workingDays: number = 22
  ): Promise<PayrollCalculationResult[]> {
    const results: PayrollCalculationResult[] = [];

    // Get all users with their basic salaries
    const users = await User.find({
      _id: { $in: userIds },
      isActive: true
    }).select('_id basicSalary');

    for (const user of users) {
      try {
        const calculation = await PayrollCalculator.calculatePayroll({
          userId: user._id.toString(),
          month,
          basicSalary: user.basicSalary,
          workingDays
        });
        results.push(calculation);
      } catch (error) {
        console.error(`Error calculating payroll for user ${user._id}:`, error);
        // Continue with other users even if one fails
      }
    }

    return results;
  }

  /**
   * Calculate payroll for all active users
   */
  static async calculateAllUsersPayroll(
    month: string,
    workingDays: number = 22
  ): Promise<PayrollCalculationResult[]> {
    const activeUsers = await User.find({ isActive: true }).select('_id');
    const userIds = activeUsers.map(user => user._id.toString());
    
    return PayrollCalculator.calculateBulkPayroll(userIds, month, workingDays);
  }

  /**
   * Validate payroll calculation inputs
   */
  static validateCalculationInput(input: PayrollCalculationInput): void {
    const { userId, month, basicSalary, workingDays } = input;

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('Month must be in YYYY-MM format');
    }

    if (!basicSalary || basicSalary <= 0) {
      throw new Error('Basic salary must be a positive number');
    }

    if (workingDays && (workingDays < 1 || workingDays > 31)) {
      throw new Error('Working days must be between 1 and 31');
    }

    // Validate month is not in the future
    const [year, monthNum] = month.split('-').map(Number);
    const monthDate = new Date(year, monthNum - 1);
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth());

    if (monthDate > currentMonth) {
      throw new Error('Cannot calculate payroll for future months');
    }
  }

  /**
   * Get payroll summary statistics
   */
  static calculatePayrollSummary(payrollData: PayrollCalculationResult[]): {
    totalEmployees: number;
    totalGross: number;
    totalNet: number;
    totalDeductions: number;
    averageGross: number;
    averageNet: number;
  } {
    const totalEmployees = payrollData.length;
    const totalGross = payrollData.reduce((sum, p) => sum + p.gross, 0);
    const totalNet = payrollData.reduce((sum, p) => sum + p.netPay, 0);
    const totalDeductions = payrollData.reduce((sum, p) => sum + p.pf + p.proTax + p.lop, 0);

    return {
      totalEmployees,
      totalGross: Math.round(totalGross),
      totalNet: Math.round(totalNet),
      totalDeductions: Math.round(totalDeductions),
      averageGross: totalEmployees > 0 ? Math.round(totalGross / totalEmployees) : 0,
      averageNet: totalEmployees > 0 ? Math.round(totalNet / totalEmployees) : 0
    };
  }
}

export default PayrollCalculator;