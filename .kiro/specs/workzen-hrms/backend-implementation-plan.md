# WorkZen HRMS Backend Implementation Plan

## Tech Stack
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Joi or Zod
- **Security:** bcrypt, helmet, cors
- **Environment:** dotenv
- **Development:** nodemon, ts-node

## Project Structure
```
Backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── environment.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── attendanceController.ts
│   │   ├── leaveController.ts
│   │   ├── payrollController.ts
│   │   └── dashboardController.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── roleCheck.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Attendance.ts
│   │   ├── Leave.ts
│   │   ├── Payroll.ts
│   │   └── LeaveBalance.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── attendance.ts
│   │   ├── leaves.ts
│   │   ├── payroll.ts
│   │   └── dashboard.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── attendanceService.ts
│   │   ├── leaveService.ts
│   │   ├── payrollService.ts
│   │   └── emailService.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── payrollCalculator.ts
│   │   └── dateHelpers.ts
│   ├── validators/
│   │   ├── authValidators.ts
│   │   ├── userValidators.ts
│   │   ├── attendanceValidators.ts
│   │   ├── leaveValidators.ts
│   │   └── payrollValidators.ts
│   └── app.ts
├── package.json
├── tsconfig.json
├── .env.example
└── server.ts
```

## Implementation Tasks

### Phase 1: Project Setup and Core Infrastructure

#### Task 1.1: Initialize Backend Project
- Set up Node.js project with TypeScript
- Install and configure dependencies (Express, MongoDB, JWT, etc.)
- Create project folder structure
- Set up development scripts and environment configuration

#### Task 1.2: Database Configuration
- Set up MongoDB connection with Mongoose
- Create database configuration and connection handling
- Implement connection error handling and retry logic
- Set up database indexes for performance

#### Task 1.3: Core Middleware Setup
- Implement CORS configuration for frontend integration
- Set up security middleware (helmet, rate limiting)
- Create error handling middleware
- Set up request logging and validation middleware

### Phase 2: Authentication and User Management

#### Task 2.1: User Model and Authentication
- Create User schema matching frontend User interface
- Implement password hashing with bcrypt
- Create JWT token generation and validation utilities
- Build authentication middleware for protected routes

#### Task 2.2: Authentication Controllers
- Implement login endpoint with credential validation
- Create user registration endpoint (Admin only)
- Build logout functionality with token blacklisting
- Add password reset functionality

#### Task 2.3: User Management System
- Create user CRUD operations with role-based permissions
- Implement user profile management
- Build user listing with search and filtering
- Add user role management for Admins

### Phase 3: Attendance Management System

#### Task 3.1: Attendance Model and Schema
- Create Attendance schema with check-in/check-out functionality
- Implement attendance status calculation logic
- Set up date-based indexing for performance
- Create attendance validation rules

#### Task 3.2: Attendance Controllers and Services
- Build check-in/check-out endpoints
- Create attendance log retrieval with date filtering
- Implement attendance reporting for HR officers
- Add bulk attendance operations for admins

#### Task 3.3: Attendance Analytics
- Create daily/monthly attendance summaries
- Implement attendance pattern analysis
- Build late arrival and early departure tracking
- Generate attendance reports for payroll integration

### Phase 4: Leave Management System

#### Task 4.1: Leave Models and Balance Tracking
- Create Leave schema with approval workflow
- Implement LeaveBalance model for tracking quotas
- Set up leave type management (Sick, Casual, Earned)
- Create leave conflict detection logic

#### Task 4.2: Leave Application and Approval
- Build leave application endpoints with validation
- Implement approval/rejection workflow for Payroll Officers
- Create leave balance calculation and updates
- Add leave calendar integration

#### Task 4.3: Leave Analytics and Reporting
- Generate leave reports for HR and management
- Implement leave trend analysis
- Create leave balance summaries
- Build leave approval notifications

### Phase 5: Payroll Processing System

#### Task 5.1: Payroll Models and Calculation Engine
- Create Payroll schema matching frontend PayrollCalculation
- Implement salary calculation logic (Basic, HRA, PF, Professional Tax)
- Build LOP (Loss of Pay) calculation based on attendance
- Create payroll processing workflow

#### Task 5.2: Payroll Controllers and Services
- Build payroll processing endpoints for Payroll Officers
- Create payslip generation and retrieval
- Implement salary component management
- Add payroll report generation

#### Task 5.3: Payroll Integration
- Integrate attendance data for payroll calculations
- Connect approved leaves to payroll processing
- Implement payroll approval workflow
- Create payroll history and audit trails

### Phase 6: Dashboard and Analytics

#### Task 6.1: Dashboard Data Services
- Create dashboard statistics aggregation
- Implement role-based dashboard data filtering
- Build real-time metrics calculation
- Generate chart data for frontend visualization

#### Task 6.2: Reporting System
- Create comprehensive HR reports
- Implement data export functionality (CSV, PDF)
- Build custom report generation
- Add scheduled report generation

### Phase 7: Security and Performance

#### Task 7.1: Security Implementation
- Implement role-based access control (RBAC)
- Add input sanitization and validation
- Set up API rate limiting
- Implement audit logging for sensitive operations

#### Task 7.2: Performance Optimization
- Add database query optimization
- Implement caching for frequently accessed data
- Set up database connection pooling
- Add API response compression

### Phase 8: Integration and Testing

#### Task 8.1: Frontend Integration
- Configure CORS for frontend domain
- Implement API endpoints matching frontend expectations
- Add error response formatting for frontend consumption
- Test all API endpoints with frontend

#### Task 8.2: Data Migration and Seeding
- Create database seeding scripts with sample data
- Implement data migration utilities
- Add database backup and restore functionality
- Create development data reset scripts

## API Endpoints Specification

### Authentication Routes (`/api/auth`)
```
POST /login          - User login
POST /register       - User registration (Admin only)
POST /logout         - User logout
GET  /profile        - Get current user profile
PUT  /profile        - Update user profile
```

### User Management Routes (`/api/users`)
```
GET    /users        - List all users (Admin/HR)
POST   /users        - Create new user (Admin)
GET    /users/:id    - Get user details
PUT    /users/:id    - Update user (Admin/HR)
DELETE /users/:id    - Delete user (Admin)
```

### Attendance Routes (`/api/attendance`)
```
POST /checkin        - Check in attendance
POST /checkout       - Check out attendance
GET  /logs           - Get attendance logs
GET  /logs/:userId   - Get user attendance logs
GET  /reports        - Generate attendance reports
```

### Leave Management Routes (`/api/leaves`)
```
POST /apply          - Apply for leave
GET  /requests       - Get leave requests
PUT  /:id/approve    - Approve leave request
PUT  /:id/reject     - Reject leave request
GET  /balance        - Get leave balance
GET  /balance/:userId - Get user leave balance
```

### Payroll Routes (`/api/payroll`)
```
POST /process        - Process payroll for month
GET  /payslips       - Get payslips
GET  /payslips/:userId - Get user payslips
PUT  /salary/:userId - Update salary components
GET  /reports        - Generate payroll reports
```

### Dashboard Routes (`/api/dashboard`)
```
GET  /stats          - Get dashboard statistics
GET  /charts         - Get chart data
GET  /recent         - Get recent activities
```

## Database Schema Design

### User Collection
```typescript
{
  _id: ObjectId,
  name: string,
  email: string (unique),
  password: string (hashed),
  role: 'Admin' | 'HR Officer' | 'Payroll Officer' | 'Employee',
  basicSalary: number,
  department: string,
  position: string,
  joinDate: Date,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Attendance Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  date: Date,
  checkIn: Date,
  checkOut: Date,
  totalHours: number,
  status: 'Present' | 'Absent' | 'Half Day' | 'Late',
  notes: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Leave Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  type: 'Sick' | 'Casual' | 'Earned',
  from: Date,
  to: Date,
  totalDays: number,
  reason: string,
  status: 'Pending' | 'Approved' | 'Rejected',
  appliedAt: Date,
  reviewedBy: ObjectId (ref: User),
  reviewedAt: Date,
  reviewComments: string
}
```

### Payroll Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  month: string, // YYYY-MM format
  basic: number,
  hra: number,
  gross: number,
  pf: number,
  proTax: number,
  lop: number,
  netPay: number,
  workingDays: number,
  presentDays: number,
  paidLeaveDays: number,
  status: 'Draft' | 'Processed' | 'Paid',
  processedAt: Date,
  processedBy: ObjectId (ref: User),
  createdAt: Date
}
```

### LeaveBalance Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  year: number,
  sickLeave: number,
  casualLeave: number,
  earnedLeave: number,
  usedSickLeave: number,
  usedCasualLeave: number,
  usedEarnedLeave: number,
  updatedAt: Date
}
```

## Environment Configuration

### Required Environment Variables
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/workzen
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:8080
```

## Development Workflow

1. **Setup Phase**: Initialize project, install dependencies, configure environment
2. **Core Development**: Implement models, controllers, and services incrementally
3. **Integration Testing**: Test each endpoint with frontend integration
4. **Security Review**: Implement security measures and validate access controls
5. **Performance Testing**: Optimize database queries and API response times
6. **Documentation**: Create API documentation and deployment guides

## Success Criteria

- ✅ All frontend API calls successfully connect to backend
- ✅ Role-based authentication and authorization working
- ✅ Complete CRUD operations for all entities
- ✅ Payroll calculations match frontend expectations
- ✅ Attendance and leave workflows functional
- ✅ Dashboard analytics provide real-time data
- ✅ Security measures implemented and tested
- ✅ Performance benchmarks met (< 200ms response time)

This backend implementation will provide a robust, scalable foundation for the WorkZen HRMS that seamlessly integrates with your existing frontend implementation.