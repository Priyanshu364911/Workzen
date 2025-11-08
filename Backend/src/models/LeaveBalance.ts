import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaveBalance extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  year: number;
  sickLeave: number;
  casualLeave: number;
  earnedLeave: number;
  usedSickLeave: number;
  usedCasualLeave: number;
  usedEarnedLeave: number;
  createdAt: Date;
  updatedAt: Date;
}

const leaveBalanceSchema = new Schema<ILeaveBalance>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2020, 'Year must be 2020 or later'],
    max: [2050, 'Year cannot be more than 2050'],
    index: true
  },
  sickLeave: {
    type: Number,
    default: 12, // 12 sick leaves per year
    min: [0, 'Sick leave cannot be negative'],
    max: [365, 'Sick leave cannot exceed 365 days']
  },
  casualLeave: {
    type: Number,
    default: 12, // 12 casual leaves per year
    min: [0, 'Casual leave cannot be negative'],
    max: [365, 'Casual leave cannot exceed 365 days']
  },
  earnedLeave: {
    type: Number,
    default: 21, // 21 earned leaves per year
    min: [0, 'Earned leave cannot be negative'],
    max: [365, 'Earned leave cannot exceed 365 days']
  },
  usedSickLeave: {
    type: Number,
    default: 0,
    min: [0, 'Used sick leave cannot be negative']
  },
  usedCasualLeave: {
    type: Number,
    default: 0,
    min: [0, 'Used casual leave cannot be negative']
  },
  usedEarnedLeave: {
    type: Number,
    default: 0,
    min: [0, 'Used earned leave cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure one record per user per year
leaveBalanceSchema.index({ userId: 1, year: 1 }, { unique: true });

// Virtual for user details
leaveBalanceSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for remaining leave balances
leaveBalanceSchema.virtual('remainingSickLeave').get(function() {
  return Math.max(0, this.sickLeave - this.usedSickLeave);
});

leaveBalanceSchema.virtual('remainingCasualLeave').get(function() {
  return Math.max(0, this.casualLeave - this.usedCasualLeave);
});

leaveBalanceSchema.virtual('remainingEarnedLeave').get(function() {
  return Math.max(0, this.earnedLeave - this.usedEarnedLeave);
});

leaveBalanceSchema.virtual('totalAllocated').get(function() {
  return this.sickLeave + this.casualLeave + this.earnedLeave;
});

leaveBalanceSchema.virtual('totalUsed').get(function() {
  return this.usedSickLeave + this.usedCasualLeave + this.usedEarnedLeave;
});

leaveBalanceSchema.virtual('totalRemaining').get(function() {
  const totalAllocated = this.sickLeave + this.casualLeave + this.earnedLeave;
  const totalUsed = this.usedSickLeave + this.usedCasualLeave + this.usedEarnedLeave;
  return totalAllocated - totalUsed;
});

// Validation to ensure used leaves don't exceed allocated leaves
leaveBalanceSchema.pre('save', function(next) {
  if (this.usedSickLeave > this.sickLeave) {
    return next(new Error('Used sick leave cannot exceed allocated sick leave'));
  }
  if (this.usedCasualLeave > this.casualLeave) {
    return next(new Error('Used casual leave cannot exceed allocated casual leave'));
  }
  if (this.usedEarnedLeave > this.earnedLeave) {
    return next(new Error('Used earned leave cannot exceed allocated earned leave'));
  }
  next();
});

// Static method to get or create leave balance for a user and year
leaveBalanceSchema.statics.getOrCreateBalance = async function(
  userId: string,
  year: number
) {
  let balance = await this.findOne({ userId, year });
  
  if (!balance) {
    balance = await this.create({
      userId,
      year,
      sickLeave: 12,
      casualLeave: 12,
      earnedLeave: 21,
      usedSickLeave: 0,
      usedCasualLeave: 0,
      usedEarnedLeave: 0
    });
  }
  
  return balance;
};

// Static method to update used leave balance
leaveBalanceSchema.statics.updateUsedLeave = async function(
  userId: string,
  year: number,
  leaveType: 'Sick' | 'Casual' | 'Earned',
  days: number,
  operation: 'add' | 'subtract' = 'add'
) {
  const balance = await (this as any).getOrCreateBalance(userId, year);
  
  const fieldMap = {
    'Sick': 'usedSickLeave',
    'Casual': 'usedCasualLeave',
    'Earned': 'usedEarnedLeave'
  };
  
  const field = fieldMap[leaveType];
  if (field) {
    const currentValue = balance[field] || 0;
    const newValue = operation === 'add' ? currentValue + days : Math.max(0, currentValue - days);
    
    balance[field] = newValue;
    await balance.save();
  }
  
  return balance;
};

// Static method to check if user has sufficient leave balance
leaveBalanceSchema.statics.checkLeaveBalance = async function(
  userId: string,
  year: number,
  leaveType: 'Sick' | 'Casual' | 'Earned',
  requestedDays: number
) {
  const balance = await (this as any).getOrCreateBalance(userId, year);
  
  const balanceMap = {
    'Sick': balance.remainingSickLeave,
    'Casual': balance.remainingCasualLeave,
    'Earned': balance.remainingEarnedLeave
  };
  
  const availableBalance = balanceMap[leaveType];
  return {
    hasBalance: availableBalance >= requestedDays,
    availableBalance,
    requestedDays,
    shortfall: Math.max(0, requestedDays - availableBalance)
  };
};

const LeaveBalance = mongoose.model<ILeaveBalance>('LeaveBalance', leaveBalanceSchema);

export default LeaveBalance;