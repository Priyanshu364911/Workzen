import mongoose from 'mongoose';
import config from './environment';

class Database {
    private static instance: Database;
    private isConnected: boolean = false;

    private constructor() { }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    public async connect(): Promise<void> {
        if (this.isConnected) {
            console.log('Database already connected');
            return;
        }

        try {
            const options = {
                maxPoolSize: 10, // Maintain up to 10 socket connections
                serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
                socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
                bufferMaxEntries: 0, // Disable mongoose buffering
                bufferCommands: false, // Disable mongoose buffering
            };

            await mongoose.connect(config.MONGODB_URI, options);

            this.isConnected = true;
            console.log('✅ MongoDB connected successfully');

            // Handle connection events
            mongoose.connection.on('error', (error) => {
                console.error('❌ MongoDB connection error:', error);
                this.isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                console.log('⚠️ MongoDB disconnected');
                this.isConnected = false;
            });

            mongoose.connection.on('reconnected', () => {
                console.log('✅ MongoDB reconnected');
                this.isConnected = true;
            });

            // Graceful shutdown
            process.on('SIGINT', async () => {
                await this.disconnect();
                process.exit(0);
            });

        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            this.isConnected = false;
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        try {
            await mongoose.connection.close();
            this.isConnected = false;
            console.log('✅ MongoDB disconnected gracefully');
        } catch (error) {
            console.error('❌ Error disconnecting from MongoDB:', error);
            throw error;
        }
    }

    public getConnectionStatus(): boolean {
        return this.isConnected;
    }
}

export default Database;