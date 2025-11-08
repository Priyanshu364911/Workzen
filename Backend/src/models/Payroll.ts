import mongoose, { Document, Schema } from 'mongoose';

export type PayrollStatus = 'Draft' | 'Processed' | 'Paid';

export interface IPayroll extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  month: string; // YYYY-MM format
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
  status: PayrollStatus;
  processedAt?: Date;
  processedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const payrollSchema = new Schema<IPayroll>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  month: {
    type: String,
    required: [true, 'Month is required'],
    match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'],
    index: true
  },
  basic: {
    type: Number,
    required: [true, 'Basic salary is required'],
    min: [0, 'Basic salary cannot be negative']
  },
  hra: {
    type: Number,
    required: [true, 'HRA is required'],
    min: [0, 'HRA cannot be negative']
  },
  gross: {
    type: Number,
    required: [true, 'Gross salary is required'],
    min: [0, 'Gross salary cannot be negative']
  },
  pf: {
    type: Number,
    required: [true, 'PF deduction is required'],
    min: [0, 'PF deduction cannot be negative']
  },
  proTax: {
    type: Number,
    required: [true, 'Professional tax is required'],
    min: [0, 'Professional tax cannot be negative'],
    default: 200
  },
  lop: {
    type: Number,
    required: [true, 'LOP is required'],
    min: [0, 'LOP cannot be negative'],
    default: 0
  },
  netPay: {
    type: Number,
    required: [true, 'Net pay is required'],
    min: [0, 'Net pay cannot be negative']
  },
  workingDays: {
    type: Number,
    required: [true, 'Working days is required'],
    min: [1, 'Working days must be at least 1'],
    max: [31, 'Working days cannot exceed 31'],
    default: 22
  },
  presentDays: {
    type: Number,
    required: [true, 'Present days is required'],
    min: [0, 'Present days cannot be negative'],
    max: [31, 'Present days cannot exceed 31']
  },
  paidLeaveDays: {
    type: Number,
    required: [true, 'Paid leave days is required'],
    min: [0, 'Paid leave days cannot be negative'],
    max: [31, 'Paid leave days cannot exceed 31'],
    default: 0
  },
  unpaidLeaveDays: {
    type: Number,
    required: [true, 'Unpaid leave days is required'],
    min: [0, 'Unpaid leave days cannot be negative'],
    max: [31, 'Unpaid leave days cannot exceed 31'],
    default: 0
  },
  status: {
    type: String,
    enum: {
      values: ['Draft', 'Processed', 'Paid'],
      message: 'Status must be one of: Draft, Processed, Paid'
    },
    default: 'Draft',
    index: true
  },
  processedAt: {
    type: Date,
    validate: {
      validator: function(this: IPayroll, value: Date) {
        // ProcessedAt is required if status is not Draft
        if (this.status !== 'Draft') {
          return !!value;
        }
        return true;
      },
      message: 'Processed date is required when payroll is processed or paid'
    }
  },
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: function(this: IPayroll, value: mongoose.Types.ObjectId) {
        // ProcessedBy is required if status is not Draft
        if (this.status !== 'Draft') {
          return !!value;
        }
        return true;
      },
      message: 'Processor is required when payroll is processed or paid'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure one payroll record per user per month
payrollSchema.index({ userId: 1, month: 1 }, { unique: true });

// Additional indexes for performance
payrollSchema.index({ month: -1, status: 1 });
payrollSchema.index({ processedBy: 1, processedAt: -1 });
payrollSchema.index({ status: 1, createdAt: -1 });

// Virtual for user details
payrollSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for processor details
payrollSchema.virtual('processor', {
  ref: 'User',
  localField: 'processedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual for total deductions
payrollSchema.virtual('totalDeductions').get(function() {
  return this.pf + this.proTax + this.lop;
});

// Virtual for effective working days (present + paid leave)
payrollSchema.virtual('effectiveWorkingDays').get(function() {
  return this.presentDays + this.paidLeaveDays;
});

// Virtual for attendance percentage
payrollSchema.virtual('attendancePercentage').get(function() {
  if (this.workingDays === 0) return 0;
  const effectiveDays = this.presentDays + this.paidLeaveDays;
  return Math.round((effectiveDays / this.workingDays) * 100);
});

// Pre-save middleware to calculate net pay
payrollSchema.pre('save', function(next) {
  this.netPay = this.gross - this.pf - this.proTax - this.lop;
  next();
});

// Pre-save middleware to set processed timestamp
payrollSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'Draft') {
    if (!this.processedAt) {
      this.processedAt = new Date();
    }
  }
  next();
});

// Validation to ensure total days don't exceed working days
payrollSchema.pre('save', function(next) {
  const totalDays = this.presentDays + this.paidLeaveDays + this.unpaidLeaveDays;
  if (totalDays > this.workingDays) {
    return next(new Error('Total of present days, paid leave days, and unpaid leave days cannot exceed working days'));
  }
  next();
});

// Static method to get payroll by month
payrollSchema.statics.getPayrollByMonth = function(month: string) {
  return this.find({ month })
    .populate('userId', 'name email department position')
    .populate('processedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get user payroll history
payrollSchema.statics.getUserPayrollHistory = function(
  userId: string,
  limit: number = 12
) {
  return this.find({ userId })
    .populate('processedBy', 'name email')
    .sort({ month: -1 })
    .limit(limit);
};

// Static method to get payroll statistics
payrollSchema.statics.getPayrollStats = function(month?: string) {
  const matchStage: any = {};
  if (month) {
    matchStage.month = month;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalGross: { $sum: '$gross' },
        totalNet: { $sum: '$netPay' },
        totalDeductions: { $sum: { $add: ['$pf', '$proTax', '$lop'] } }
      }
    }
  ]);
};

// Static method to calculate payroll for a user
payrollSchema.statics.calculatePayroll = function(
  userId: string,
  month: string,
  basicSalary: number,
  presentDays: number,
  paidLeaveDays: number = 0,
  workingDays: number = 22
) {
  const basic = basicSalary;
  const hra = basic * 0.4; // 40% of basic
  const gross = basic + hra;
  const pf = basic * 0.12; // 12% of basic
  const proTax = 200; // Fixed professional tax
  
  // Calculate LOP (Loss of Pay)
  const effectiveDays = presentDays + paidLeaveDays;
  const absentDays = Math.max(0, workingDays - effectiveDays);
  const lop = (absentDays * gross) / workingDays;
  
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
};

const Payroll = mongoose.model<IPayroll>('Payroll', payrollSchema);

export default Payroll;