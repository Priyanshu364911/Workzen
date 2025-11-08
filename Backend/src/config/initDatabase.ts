import mongoose from 'mongoose';
import Database from './database';

// Import all models to ensure they are registered
import User from '../models/User';
import Attendance from '../models/Attendance';
import Leave from '../models/Leave';
import LeaveBalance from '../models/LeaveBalance';
import Payroll from '../models/Payroll';

export class DatabaseInitializer {
  /**
   * Initialize database with indexes and constraints
   */
  static async initializeDatabase(): Promise<void> {
    try {
      console.log('🔧 Initializing database...');

      // Ensure all indexes are created
      await Promise.all([
        User.createIndexes(),
        Attendance.createIndexes(),
        Leave.createIndexes(),
        LeaveBalance.createIndexes(),
        Payroll.createIndexes()
      ]);

      console.log('✅ Database indexes created successfully');

      // Create any additional constraints or configurations
      await DatabaseInitializer.createAdditionalConstraints();

      console.log('✅ Database initialization completed');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create additional database constraints
   */
  private static async createAdditionalConstraints(): Promise<void> {
    try {
      // Add any additional database-level constraints here
      // For example, you might want to create custom validators or triggers
      
      // Ensure admin user exists
      const adminExists = await User.findOne({ role: 'Admin' });
      if (!adminExists) {
        console.log('⚠️ No admin user found. Please run seed script to create initial users.');
      }

      console.log('✅ Additional constraints applied');
    } catch (error) {
      console.error('❌ Failed to create additional constraints:', error);
      throw error;
    }
  }

  /**
   * Drop all collections (use with caution!)
   */
  static async dropAllCollections(): Promise<void> {
    try {
      console.log('🗑️ Dropping all collections...');
      
      if (!mongoose.connection.db) {
        throw new Error('Database connection not established');
      }
      
      const collections = await mongoose.connection.db.listCollections().toArray();
      
      for (const collection of collections) {
        await mongoose.connection.db.dropCollection(collection.name);
        console.log(`   Dropped collection: ${collection.name}`);
      }
      
      console.log('✅ All collections dropped');
    } catch (error) {
      console.error('❌ Failed to drop collections:', error);
      throw error;
    }
  }

  /**
   * Reset database (drop and reinitialize)
   */
  static async resetDatabase(): Promise<void> {
    try {
      console.log('🔄 Resetting database...');
      
      await DatabaseInitializer.dropAllCollections();
      await DatabaseInitializer.initializeDatabase();
      
      console.log('✅ Database reset completed');
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      throw error;
    }
  }

  /**
   * Check database health
   */
  static async checkDatabaseHealth(): Promise<{
    connected: boolean;
    collections: string[];
    indexes: any;
  }> {
    try {
      const connected = mongoose.connection.readyState === 1;
      
      if (!connected) {
        return {
          connected: false,
          collections: [],
          indexes: {}
        };
      }

      if (!mongoose.connection.db) {
        throw new Error('Database connection not established');
      }

      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);

      const indexes: any = {};
      for (const collectionName of collectionNames) {
        try {
          indexes[collectionName] = await mongoose.connection.db
            .collection(collectionName)
            .listIndexes()
            .toArray();
        } catch (error) {
          indexes[collectionName] = [];
        }
      }

      return {
        connected: true,
        collections: collectionNames,
        indexes
      };
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return {
        connected: false,
        collections: [],
        indexes: {}
      };
    }
  }
}

// Script to run database initialization
export const runDatabaseInit = async (): Promise<void> => {
  try {
    const database = Database.getInstance();
    await database.connect();
    
    await DatabaseInitializer.initializeDatabase();
    
    await database.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  runDatabaseInit();
}

export default DatabaseInitializer;