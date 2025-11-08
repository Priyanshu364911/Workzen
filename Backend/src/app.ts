import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import config from './config/environment';
import { globalErrorHandler, AppError } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import attendanceRoutes from './routes/attendance';
import leaveRoutes from './routes/leaves';
// import payrollRoutes from './routes/payroll';
// import dashboardRoutes from './routes/dashboard';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    this.app.use(cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX_REQUESTS,
      message: {
        success: false,
        error: {
          message: 'Too many requests from this IP, please try again later.'
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression middleware
    this.app.use(compression());

    // Logging middleware
    if (config.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Request timestamp middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.requestTime = new Date().toISOString();
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'WorkZen HRMS API is running',
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/attendance', attendanceRoutes);
    this.app.use('/api/leaves', leaveRoutes);
    // this.app.use('/api/payroll', payrollRoutes);
    // this.app.use('/api/dashboard', dashboardRoutes);

    // Handle undefined routes
    this.app.all('*', (req: Request, res: Response, next: NextFunction) => {
      next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(globalErrorHandler);
  }

  public getApp(): Application {
    return this.app;
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      requestTime?: string;
    }
  }
}

export default App;