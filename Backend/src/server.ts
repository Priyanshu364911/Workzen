import App from './app';
import Database from './config/database';
import config from './config/environment';

class Server {
  private app: App;
  private database: Database;

  constructor() {
    this.app = new App();
    this.database = Database.getInstance();
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await this.database.connect();

      // Start server
      const server = this.app.getApp().listen(config.PORT, () => {
        console.log(`🚀 WorkZen HRMS API Server running on port ${config.PORT}`);
        console.log(`📝 Environment: ${config.NODE_ENV}`);
        console.log(`🌐 CORS Origin: ${config.CORS_ORIGIN}`);
        console.log(`📊 Health Check: http://localhost:${config.PORT}/health`);
      });

      // Graceful shutdown
      const gracefulShutdown = async (signal: string) => {
        console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
        
        server.close(async () => {
          console.log('✅ HTTP server closed');
          
          try {
            await this.database.disconnect();
            console.log('✅ Database connection closed');
            process.exit(0);
          } catch (error) {
            console.error('❌ Error during database shutdown:', error);
            process.exit(1);
          }
        });

        // Force close server after 30 seconds
        setTimeout(() => {
          console.error('❌ Could not close connections in time, forcefully shutting down');
          process.exit(1);
        }, 30000);
      };

      // Handle shutdown signals
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));

      // Handle uncaught exceptions
      process.on('uncaughtException', (error: Error) => {
        console.error('💥 Uncaught Exception:', error);
        process.exit(1);
      });

      // Handle unhandled promise rejections
      process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
        console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
        server.close(() => {
          process.exit(1);
        });
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new Server();
server.start();