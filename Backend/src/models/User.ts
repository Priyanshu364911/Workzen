import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type Role = 'Admin' | 'HR Officer' | 'Payroll Officer' | 'Employee';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  basicSalary: number;
  department?: string;
  position?: string;
  joinDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  toJSON(): any;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ['Admin', 'HR Officer', 'Payroll Officer', 'Employee'],
      message: 'Role must be one of: Admin, HR Officer, Payroll Officer, Employee'
    },
    required: [true, 'Role is required'],
    default: 'Employee'
  },
  basicSalary: {
    type: Number,
    required: [true, 'Basic salary is required'],
    min: [0, 'Basic salary cannot be negative']
  },
  department: {
    type: String,
    trim: true,
    maxlength: [50, 'Department cannot be more than 50 characters']
  },
  position: {
    type: String,
    trim: true,
    maxlength: [50, 'Position cannot be more than 50 characters']
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  try {
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Override toJSON to exclude sensitive fields
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Static method to find user by email with password
userSchema.statics.findByEmailWithPassword = function(email: string) {
  return this.findOne({ email }).select('+password');
};

const User = mongoose.model<IUser>('User', userSchema);

export default User;