import User from '../models/User';
import Database from '../config/database';

export const seedUsers = async (): Promise<void> => {
  try {
    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('Users already exist, skipping seed');
      return;
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

    await User.insertMany(seedUsers);
    console.log('✅ Seed users created successfully');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

// Script to run seeding
export const runSeed = async (): Promise<void> => {
  try {
    const database = Database.getInstance();
    await database.connect();
    
    console.log('🌱 Starting database seeding...');
    await seedUsers();
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