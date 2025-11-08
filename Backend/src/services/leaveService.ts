import Leave, { ILeave, LeaveType, LeaveStatus } from '../models/Leave';
import LeaveBalance, { ILeaveBalance } from '../models/LeaveBalance';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';

export interface ApplyLeaveData {
  type: LeaveType;
  from: Date;
  to: Date;
  reason: string;
}

export interface ReviewLeaveData {
  status: 'Approved' | 'Rejected';
  reviewComments?: string;
}

export interface UpdateLeaveData {
  type?: LeaveType;
  from?: Date;
  to?: Date;
  reason?: string;
  status?: LeaveStatus;
  reviewComments?: string;
}

export interface GetLeaveQuery {
  userId?: string;
  type?: LeaveType;
  status?: LeaveStatus;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface AllocateLeaveData {
  userId: string;
  year: number;
  sickLeave?: number;
  casualLeave?: number;
  earnedLeave?: number;
}

export interface PaginatedLeaves {
  leaves: ILeave[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class LeaveService {
  /**
   * Apply for leave
   */
  static async applyLeave(userId: string, data: ApplyLeaveData): Promise<ILeave> {
    const { type, from, to, reason } = data;

    // Verify user exists and is active
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 404);
    }

    // Calculate total days
    const diffTime = to.getTime() - from.getTime();
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check for overlapping leaves
    const overlappingLeave = await (Leave as any).checkOverlappingLeaves(userId, from, to);
    if (overlappingLeave) {
      throw new AppError('You already have a leave request for overlapping dates', 400);
    }

    // Check leave balance
    const year = from.getFullYear();
    const leaveTypeMap: { [key in LeaveType]: 'Sick' | 'Casual' | 'Earned' } = {
      'Sick': 'Sick',
      'Casual': 'Casual',
      'Earned': 'Earned',
      'Maternity': 'Earned', // Maternity leave uses earned leave balance
      'Paternity': 'Earned'  // Paternity leave uses earned leave balance
    };

    const balanceType = leaveTypeMap[type];
    const balanceCheck = await (LeaveBalance as any).checkLeaveBalance(userId, year, balanceType, totalDays);
    
    if (!balanceCheck.hasBalance) {
      throw new AppError(
        `Insufficient leave balance. Available: ${balanceCheck.availableBalance} days, Requested: ${balanceCheck.requestedDays} days`,
        400
      );
    }

    // Create leave application
    const leave = await Leave.create({
      userId,
      type,
      from,
      to,
      totalDays,
      reason,
      status: 'Pending',
      appliedAt: new Date()
    });

    return leave;
  }

  /**
   * Review leave application (Approve/Reject)
   */
  static async reviewLeave(
    leaveId: string,
    reviewerId: string,
    data: ReviewLeaveData
  ): Promise<ILeave> {
    const { status, reviewComments } = data;

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      throw new AppError('Leave application not found', 404);
    }

    if (leave.status !== 'Pending') {
      throw new AppError('Leave application has already been reviewed', 400);
    }

    // Update leave status
    leave.status = status;
    leave.reviewedBy = reviewerId as any;
    leave.reviewedAt = new Date();
    if (reviewComments) {
      leave.reviewComments = reviewComments;
    }

    await leave.save();

    // Update leave balance if approved
    if (status === 'Approved') {
      const year = leave.from.getFullYear();
      const leaveTypeMap: { [key in LeaveType]: 'Sick' | 'Casual' | 'Earned' } = {
        'Sick': 'Sick',
        'Casual': 'Casual',
        'Earned': 'Earned',
        'Maternity': 'Earned',
        'Paternity': 'Earned'
      };

      const balanceType = leaveTypeMap[leave.type];
      await (LeaveBalance as any).updateUsedLeave(
        leave.userId,
        year,
        balanceType,
        leave.totalDays,
        'add'
      );
    }

    return leave;
  }

  /**
   * Get leave applications with pagination and filtering
   */
  static async getLeaves(query: GetLeaveQuery): Promise<PaginatedLeaves> {
    const {
      userId,
      type,
      status,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder
    } = query;

    // Build filter object
    const filter: any = {};

    if (userId) {
      filter.userId = userId;
    }

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.$or = [];
      
      if (startDate && endDate) {
        // Leave overlaps with the date range
        filter.$or.push({
          from: { $lte: endDate },
          to: { $gte: startDate }
        });
      } else if (startDate) {
        filter.$or.push({
          to: { $gte: startDate }
        });
      } else if (endDate) {
        filter.$or.push({
          from: { $lte: endDate }
        });
      }
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [leaves, totalRecords] = await Promise.all([
      Leave.find(filter)
        .populate('user', 'name email department position')
        .populate('reviewer', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Leave.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      leaves,
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
   * Get leave by ID
   */
  static async getLeaveById(leaveId: string): Promise<ILeave> {
    const leave = await Leave.findById(leaveId)
      .populate('user', 'name email department position')
      .populate('reviewer', 'name email');
    
    if (!leave) {
      throw new AppError('Leave application not found', 404);
    }

    return leave;
  }

  /**
   * Update leave application (Admin/HR only)
   */
  static async updateLeave(leaveId: string, data: UpdateLeaveData): Promise<ILeave> {
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      throw new AppError('Leave application not found', 404);
    }

    // If dates are being updated, check for overlaps
    if (data.from || data.to) {
      const newFrom = data.from || leave.from;
      const newTo = data.to || leave.to;
      
      const overlappingLeave = await (Leave as any).checkOverlappingLeaves(
        leave.userId,
        newFrom,
        newTo,
        leaveId
      );
      
      if (overlappingLeave) {
        throw new AppError('Updated dates overlap with another leave request', 400);
      }
    }

    // Update leave
    const updatedLeave = await Leave.findByIdAndUpdate(
      leaveId,
      data,
      {
        new: true,
        runValidators: true
      }
    ).populate('user', 'name email department position')
     .populate('reviewer', 'name email');

    return updatedLeave!;
  }

  /**
   * Delete leave application (Admin only or own pending applications)
   */
  static async deleteLeave(leaveId: string, userId?: string): Promise<void> {
    const leave = await Leave.findById(leaveId);
    
    if (!leave) {
      throw new AppError('Leave application not found', 404);
    }

    // If userId is provided, check if user owns the leave and it's pending
    if (userId && leave.userId.toString() !== userId) {
      throw new AppError('You can only delete your own leave applications', 403);
    }

    if (userId && leave.status !== 'Pending') {
      throw new AppError('You can only delete pending leave applications', 400);
    }

    // If leave was approved, revert the leave balance
    if (leave.status === 'Approved') {
      const year = leave.from.getFullYear();
      const leaveTypeMap: { [key in LeaveType]: 'Sick' | 'Casual' | 'Earned' } = {
        'Sick': 'Sick',
        'Casual': 'Casual',
        'Earned': 'Earned',
        'Maternity': 'Earned',
        'Paternity': 'Earned'
      };

      const balanceType = leaveTypeMap[leave.type];
      await (LeaveBalance as any).updateUsedLeave(
        leave.userId,
        year,
        balanceType,
        leave.totalDays,
        'subtract'
      );
    }

    await Leave.findByIdAndDelete(leaveId);
  }

  /**
   * Get leave balance for user
   */
  static async getLeaveBalance(userId: string, year: number): Promise<ILeaveBalance> {
    const balance = await (LeaveBalance as any).getOrCreateBalance(userId, year);
    return balance;
  }

  /**
   * Allocate leave balance (Admin/HR only)
   */
  static async allocateLeaveBalance(data: AllocateLeaveData): Promise<ILeaveBalance> {
    const { userId, year, sickLeave, casualLeave, earnedLeave } = data;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get or create leave balance
    let balance = await LeaveBalance.findOne({ userId, year });
    
    if (!balance) {
      balance = new LeaveBalance({
        userId,
        year,
        sickLeave: sickLeave || 12,
        casualLeave: casualLeave || 12,
        earnedLeave: earnedLeave || 21
      });
    } else {
      if (sickLeave !== undefined) balance.sickLeave = sickLeave;
      if (casualLeave !== undefined) balance.casualLeave = casualLeave;
      if (earnedLeave !== undefined) balance.earnedLeave = earnedLeave;
    }

    await balance.save();
    return balance;
  }

  /**
   * Get pending leaves for approval
   */
  static async getPendingLeaves(limit: number = 10): Promise<ILeave[]> {
    return await (Leave as any).getPendingLeaves(limit);
  }

  /**
   * Get leave summary for user
   */
  static async getUserLeaveSummary(userId: string, year: number): Promise<any> {
    const [leaveSummary, leaveBalance] = await Promise.all([
      (Leave as any).getLeaveSummary(userId, year),
      LeaveService.getLeaveBalance(userId, year)
    ]);

    return {
      summary: leaveSummary,
      balance: leaveBalance,
      year
    };
  }

  /**
   * Get leave statistics
   */
  static async getLeaveStats(startDate?: Date, endDate?: Date): Promise<any> {
    const matchStage: any = {};
    
    if (startDate || endDate) {
      matchStage.$or = [];
      
      if (startDate && endDate) {
        matchStage.$or.push({
          from: { $lte: endDate },
          to: { $gte: startDate }
        });
      } else if (startDate) {
        matchStage.$or.push({
          to: { $gte: startDate }
        });
      } else if (endDate) {
        matchStage.$or.push({
          from: { $lte: endDate }
        });
      }
    }

    const [statusStats, typeStats] = await Promise.all([
      Leave.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalDays: { $sum: '$totalDays' }
          }
        }
      ]),
      Leave.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalDays: { $sum: '$totalDays' }
          }
        }
      ])
    ]);

    const totalApplications = await Leave.countDocuments(matchStage);

    return {
      byStatus: statusStats,
      byType: typeStats,
      totalApplications,
      period: startDate && endDate ? { startDate, endDate } : null
    };
  }
}

export default LeaveService;