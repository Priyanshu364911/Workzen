import User from '../models/User';
import Attendance from '../models/Attendance';
import Leave from '../models/Leave';
import LeaveBalance from '../models/LeaveBalance';
import Payroll from '../models/Payroll';
import Database from '../config/database';

export const seedUsers = async (): Promise<any[]> => {
  try {
    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('Users already exist, skipping seed');
      return [];
    }

    // Create seed users matching frontend mock data
    const seedUsers = [
      {
        name: 'Admin User',
        email: 'admin@workzen.com',
        password: 'password123',
        role: 'Admin' as const,
        basicSalary: 100000,
        department: 'Administration',
        position: 'System Administrator'
      },
      {
        name: 'Priya HR',
        email: 'hr@workzen.com',
        password: 'password123',
        role: 'HR Officer' as const,
        basicSalary: 80000,
        department: 'Human Resources',
        position: 'HR Manager'
      },
      {
        name: 'Raj Payroll',
        email: 'payroll@workzen.com',
        password: 'password123',
        role: 'Payroll Officer' as const,
        basicSalary: 75000,
        department: 'Finance',
        position: 'Payroll Specialist'
      },
      {
        name: 'Amit Kumar',
        email: 'amit@workzen.com',
        password: 'password123',
        role: 'Employee' as const,
        basicSalary: 60000,
        department: 'Engineering',
        position: 'Software Developer'
      },
      {
        name: 'Sneha Singh',
        email: 'sneha@workzen.com',
        password: 'password123',
        role: 'Employee' as const,
        basicSalary: 55000,
        department: 'Engineering',
        position: 'Frontend Developer'
      },
      {
        name: 'Rahul Verma',
        email: 'rahul@workzen.com',
        password: 'password123',
        role: 'Employee' as const,
        basicSalary: 65000,
        department: 'Engineering',
        position: 'Backend Developer'
      },
      {
        name: 'Kavita Patel',
        email: 'kavita@workzen.com',
        password: 'password123',
        role: 'Employee' as const,
        basicSalary: 58000,
        department: 'Design',
        position: 'UI/UX Designer'
      }
    ];

    const createdUsers = await User.insertMany(seedUsers);
    console.log('✅ Seed users created successfully');
    
    return createdUsers;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

export const seedLeaveBalances = async (users: any[]): Promise<void> => {
  try {
    const currentYear = new Date().getFullYear();
    
    const leaveBalances = users.map(user => ({
      userId: user._id,
      year: currentYear,
      sickLeave: 12,
      casualLeave: 12,
      earnedLeave: 21,
      usedSickLeave: 0,
      usedCasualLeave: 0,
      usedEarnedLeave: 0
    }));

    await LeaveBalance.insertMany(leaveBalances);
    console.log('✅ Leave balances created successfully');
  } catch (error) {
    console.error('❌ Error seeding leave balances:', error);
    throw error;
  }
};

export const seedSampleAttendance = async (users: any[]): Promise<void> => {
  try {
    const employees = users.filter(user => user.role === 'Employee');
    const attendanceRecords = [];
    
    // Create attendance for last 30 days
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      for (const employee of employees) {
        // 90% attendance rate
        if (Math.random() > 0.1) {
          const checkIn = new Date(date);
          checkIn.setHours(9, Math.floor(Math.random() * 30), 0, 0); // 9:00-9:30 AM
          
          const checkOut = new Date(date);
          checkOut.setHours(17, 30 + Math.floor(Math.random() * 60), 0, 0); // 5:30-6:30 PM
          
          attendanceRecords.push({
            userId: employee._id,
            date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            checkIn,
            checkOut,
            status: 'Present'
          });
        }
      }
    }

    await Attendance.insertMany(attendanceRecords);
    console.log('✅ Sample attendance records created successfully');
  } catch (error) {
    console.error('❌ Error seeding attendance:', error);
    throw error;
  }
};

export const seedSampleLeaves = async (users: any[]): Promise<void> => {
  try {
    const employees = users.filter(user => user.role === 'Employee');
    const leaveRecords = [];
    
    for (const employee of employees) {
      // Create 1-2 leave records per employee
      const numLeaves = Math.floor(Math.random() * 2) + 1;
      
      for (let i = 0; i < numLeaves; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 60) + 1);
        
        const leaveTypes = ['Sick', 'Casual', 'Earned'];
        const statuses = ['Pending', 'Approved', 'Rejected'];
        
        leaveRecords.push({
          userId: employee._id,
          type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
          from: futureDate,
          to: new Date(futureDate.getTime() + Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000),
          reason: 'Sample leave request for testing purposes',
          status: statuses[Math.floor(Math.random() * statuses.length)],
          appliedAt: new Date()
        });
      }
    }

    await Leave.insertMany(leaveRecords);
    console.log('✅ Sample leave records created successfully');
  } catch (error) {
    console.error('❌ Error seeding leaves:', error);
    throw error;
  }
};

// Script to run seeding
export const runSeed = async (): Promise<void> => {
  try {
    const database = Database.getInstance();
    await database.connect();
    
    console.log('🌱 Starting database seeding...');
    
    const users = await seedUsers();
    await seedLeaveBalances(users);
    await seedSampleAttendance(users);
    await seedSampleLeaves(users);
    
    console.log('✅ Database seeding completed');
    
    await database.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  runSeed();
}