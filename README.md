# WorkZen HRMS - Human Resource Management System

A comprehensive HRMS solution built with Node.js, Express, MongoDB, React, and TypeScript.

## Features

- **User Authentication & Authorization**
  - Role-based access control (Admin, HR Officer, Payroll Officer, Employee)
  - JWT-based authentication
  - Secure password hashing

- **Employee Management**
  - Employee directory with search and filtering
  - Profile management
  - Department and role management

- **Attendance Management**
  - Check-in/Check-out functionality
  - Attendance tracking and reporting
  - Manual attendance entry (Admin/HR)

- **Leave Management**
  - Leave application system
  - Leave approval workflow
  - Leave balance tracking
  - Multiple leave types (Sick, Casual, Earned, Maternity, Paternity)

- **Payroll Management**
  - Automated payroll processing
  - Salary calculations with deductions
  - Payslip generation
  - Payroll reports

- **Dashboard & Analytics**
  - Real-time statistics
  - Interactive charts and graphs
  - Role-specific dashboards

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Joi** - Data validation

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **React Router** - Navigation
- **Recharts** - Data visualization

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd workzen-hrms
   ```

2. **Backend Setup**
   ```bash
   cd Backend
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your configuration
   
   # Start the backend server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd Frontend
   npm install
   
   # Start the frontend development server
   npm run dev
   ```

### Environment Variables

Create a `.env` file in the Backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/workzen_hrms

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Default Users

The system comes with pre-seeded demo users:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@workzen.com | password123 |
| HR Officer | hr@workzen.com | password123 |
| Payroll Officer | payroll@workzen.com | password123 |
| Employee | amit@workzen.com | password123 |

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Admin only)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token

### User Management
- `GET /api/users` - Get all users (with pagination and filters)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Attendance Management
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance/status` - Get current attendance status
- `GET /api/attendance/logs` - Get attendance logs
- `POST /api/attendance/manual` - Create manual attendance

### Leave Management
- `POST /api/leaves/apply` - Apply for leave
- `GET /api/leaves` - Get leave applications
- `PUT /api/leaves/:id/approve` - Approve leave
- `PUT /api/leaves/:id/reject` - Reject leave
- `GET /api/leaves/balance` - Get leave balance

### Payroll Management
- `POST /api/payroll/process` - Process payroll
- `GET /api/payroll` - Get payroll records
- `GET /api/payroll/payslips` - Get payslips

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/stats` - Get statistics

## Project Structure

```
workzen-hrms/
├── Backend/
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   ├── config/          # Configuration files
│   │   └── app.ts           # Express app setup
│   ├── package.json
│   └── .env.example
├── Frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── context/         # React context
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Utility functions
│   │   └── main.tsx         # App entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Development

### Backend Development
```bash
cd Backend
npm run dev          # Start with nodemon
npm run build        # Build for production
npm start            # Start production server
```

### Frontend Development
```bash
cd Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@workzen.com or create an issue in the repository.