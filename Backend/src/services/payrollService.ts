import Payroll, { IPayroll, PayrollStatus } from '../models/Payroll';
import User from '../models/User';
import PayrollCalculator, { PayrollCalculationResult } from '../utils/payrollCalculator';
import { AppError } from '../middleware/errorHandler';

export interface ProcessPayrollData {
  month: string;
  userIds?: string[];
  workingDays?: number;
}

export interface UpdatePayrollData {
  basic?: number;
  hra?: number;
  pf?: number;
  proTax?: number;
  lop?: number;
  workingDays?: number;
  presentDays?: number;
  paidLeaveDays?: number;
  status?: PayrollStatus;
}

export interface GetPayrollQuery {
  month?: string;
  userId?: string;
  status?: PayrollStatus;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PayrollReportQuery {
  startMonth: string;
  endMonth: string;
  userId?: string;
  department?: string;
  status?: PayrollStatus;
  format: 'json' | 'csv';
}

export interface PaginatedPayroll {
  payroll: IPayroll[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class PayrollService {
  /**
   * Process payroll for specified users or all users
   */
  static async processPayroll(
    processedBy: string,
    data: ProcessPayrollData
  ): Promise<{ processed: IPayroll[]; skipped: string[]; summary: any }> {
    const { month, userIds, workingDays = 22 } = data;

    // Validate month format and ensure it's not in the future
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new AppError('Month must be in YYYY-MM format', 400);
    }

    const [year, monthNum] = month.split('-').map(Number);
    const monthDate = new Date(year, monthNum - 1);
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth());

    if (monthDate > currentMonth) {
      throw new AppError('Cannot process payroll for future months', 400);
    }

    // Get target users
    let targetUsers;
    if (userIds && userIds.length > 0) {
      targetUsers = await User.find({
        _id: { $in: userIds },
        isActive: true
      });
    } else {
      targetUsers = await User.find({ isActive: true });
    }

    if (targetUsers.length === 0) {
      throw new AppError('No active users found for payroll processing', 404);
    }

    const processed: IPayroll[] = [];
    const skipped: string[] = [];

    for (const user of targetUsers) {
      try {
        // Check if payroll already exists for this user and month
        const existingPayroll = await Payroll.findOne({
          userId: user._id,
          month
        });

        if (existingPayroll) {
          skipped.push(`${user.name} (${user.email}) - Payroll already exists`);
          continue;
        }

        // Calculate payroll
        const calculation = await PayrollCalculator.calculatePayroll({
          userId: user._id.toString(),
          month,
          basicSalary: user.basicSalary,
          workingDays
        });

        // Create payroll record
        const payroll = await Payroll.create({
          ...calculation,
          status: 'Processed',
          processedBy,
          processedAt: new Date()
        });

        processed.push(payroll);
      } catch (error) {
        console.error(`Error processing payroll for user ${user._id}:`, error);
        skipped.push(`${user.name} (${user.email}) - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Generate summary
    const calculations = processed.map(p => ({
      userId: p.userId.toString(),
      month: p.month,
      basic: p.basic,
      hra: p.hra,
      gross: p.gross,
      pf: p.pf,
      proTax: p.proTax,
      lop: p.lop,
      netPay: p.netPay,
      workingDays: p.workingDays,
      presentDays: p.presentDays,
      paidLeaveDays: p.paidLeaveDays,
      unpaidLeaveDays: p.unpaidLeaveDays
    }));

    const summary = PayrollCalculator.calculatePayrollSummary(calculations);

    return {
      processed,
      skipped,
      summary
    };
  }

  /**
   * Get payroll records with pagination and filtering
   */
  static async getPayroll(query: GetPayrollQuery): Promise<PaginatedPayroll> {
    const {
      month,
      userId,
      status,
      page,
      limit,
      sortBy,
      sortOrder
    } = query;

    // Build filter object
    const filter: any = {};

    if (month) {
      filter.month = month;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (status) {
      filter.status = status;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [payroll, totalRecords] = await Promise.all([
      Payroll.find(filter)
        .populate('userId', 'name email department position')
        .populate('processedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Payroll.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      payroll,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get payroll by ID
   */
  static async getPayrollById(payrollId: string): Promise<IPayroll> {
    const payroll = await Payroll.findById(payrollId)
      .populate('userId', 'name email department position')
      .populate('processedBy', 'name email');
    
    if (!payroll) {
      throw new AppError('Payroll record not found', 404);
    }

    return payroll;
  }

  /**
   * Update payroll record
   */
  static async updatePayroll(payrollId: string, data: UpdatePayrollData): Promise<IPayroll> {
    const payroll = await Payroll.findByIdAndUpdate(
      payrollId,
      data,
      {
        new: true,
        runValidators: true
      }
    ).populate('userId', 'name email department position')
     .populate('processedBy', 'name email');

    if (!payroll) {
      throw new AppError('Payroll record not found', 404);
    }

    return payroll;
  }

  /**
   * Delete payroll record (Admin only)
   */
  static async deletePayroll(payrollId: string): Promise<void> {
    const payroll = await Payroll.findByIdAndDelete(payrollId);
    
    if (!payroll) {
      throw new AppError('Payroll record not found', 404);
    }
  }

  /**
   * Get payroll by month
   */
  static async getPayrollByMonth(month: string): Promise<IPayroll[]> {
    return await (Payroll as any).getPayrollByMonth(month);
  }

  /**
   * Get user payroll history
   */
  static async getUserPayrollHistory(userId: string, limit: number = 12): Promise<IPayroll[]> {
    return await (Payroll as any).getUserPayrollHistory(userId, limit);
  }

  /**
   * Update user salary (affects future payroll calculations)
   */
  static async updateUserSalary(userId: string, basicSalary: number): Promise<any> {
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
   * Generate payroll report
   */
  static async generatePayrollReport(query: PayrollReportQuery): Promise<any> {
    const { startMonth, endMonth, userId, department, status } = query;

    // Build match stage for aggregation
    const matchStage: any = {
      month: { $gte: startMonth, $lte: endMonth }
    };

    if (userId) {
      matchStage.userId = userId;
    }

    if (status) {
      matchStage.status = status;
    }

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ];

    // Add department filter if specified
    if (department) {
      pipeline.push({
        $match: {
          'user.department': { $regex: department, $options: 'i' }
        }
      });
    }

    // Add projection for clean output
    pipeline.push({
      $project: {
        month: 1,
        basic: 1,
        hra: 1,
        gross: 1,
        pf: 1,
        proTax: 1,
        lop: 1,
        netPay: 1,
        workingDays: 1,
        presentDays: 1,
        paidLeaveDays: 1,
        unpaidLeaveDays: 1,
        status: 1,
        processedAt: 1,
        'user.name': 1,
        'user.email': 1,
        'user.department': 1,
        'user.position': 1
      }
    });

    // Sort by month and user name
    pipeline.push({
      $sort: { month: -1, 'user.name': 1 }
    });

    const reportData = await Payroll.aggregate(pipeline);

    // Generate summary statistics
    const summaryPipeline = [...pipeline];
    summaryPipeline.pop(); // Remove sort stage
    summaryPipeline.push({
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        totalGross: { $sum: '$gross' },
        totalNet: { $sum: '$netPay' },
        totalDeductions: { $sum: { $add: ['$pf', '$proTax', '$lop'] } },
        avgGross: { $avg: '$gross' },
        avgNet: { $avg: '$netPay' }
      }
    });

    const summary = await Payroll.aggregate(summaryPipeline);

    return {
      data: reportData,
      summary: summary[0] || {
        totalRecords: 0,
        totalGross: 0,
        totalNet: 0,
        totalDeductions: 0,
        avgGross: 0,
        avgNet: 0
      },
      period: { startMonth, endMonth },
      totalRecords: reportData.length
    };
  }

  /**
   * Get payroll statistics
   */
  static async getPayrollStats(month?: string): Promise<any> {
    return await (Payroll as any).getPayrollStats(month);
  }

  /**
   * Calculate payroll preview (without saving)
   */
  static async calculatePayrollPreview(
    month: string,
    userIds?: string[],
    workingDays: number = 22
  ): Promise<{ calculations: PayrollCalculationResult[]; summary: any }> {
    // Get target users
    let targetUsers;
    if (userIds && userIds.length > 0) {
      targetUsers = await User.find({
        _id: { $in: userIds },
        isActive: true
      });
    } else {
      targetUsers = await User.find({ isActive: true });
    }

    const calculations: PayrollCalculationResult[] = [];

    for (const user of targetUsers) {
      try {
        const calculation = await PayrollCalculator.calculatePayroll({
          userId: user._id.toString(),
          month,
          basicSalary: user.basicSalary,
          workingDays
        });
        calculations.push(calculation);
      } catch (error) {
        console.error(`Error calculating payroll preview for user ${user._id}:`, error);
      }
    }

    const summary = PayrollCalculator.calculatePayrollSummary(calculations);

    return {
      calculations,
      summary
    };
  }
}

export default PayrollService;