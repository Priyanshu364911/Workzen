import { User, Role } from '@/context/AuthContext';

export const mockUsers: User[] = [
  { _id: "1", name: "Admin User", email: "admin@workzen.com", role: "Admin", basicSalary: 100000 },
  { _id: "2", name: "Priya HR", email: "hr@workzen.com", role: "HR Officer", basicSalary: 80000 },
  { _id: "3", name: "Raj Payroll", email: "payroll@workzen.com", role: "Payroll Officer", basicSalary: 75000 },
  { _id: "4", name: "Amit Kumar", email: "amit@workzen.com", role: "Employee", basicSalary: 60000 },
  { _id: "5", name: "Sneha Singh", email: "sneha@workzen.com", role: "Employee", basicSalary: 55000 },
  { _id: "6", name: "Rahul Verma", email: "rahul@workzen.com", role: "Employee", basicSalary: 65000 },
  { _id: "7", name: "Kavita Patel", email: "kavita@workzen.com", role: "Employee", basicSalary: 58000 }
];

export interface Attendance {
  _id: string;
  userId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'Present' | 'Absent' | 'Half Day';
}

export const mockAttendance: Attendance[] = [
  { _id: "1", userId: "4", date: "2025-03-15", checkIn: "09:00", checkOut: "17:30", status: "Present" },
  { _id: "2", userId: "4", date: "2025-03-16", status: "Absent" },
  { _id: "3", userId: "5", date: "2025-03-15", checkIn: "09:15", checkOut: "17:45", status: "Present" },
  { _id: "4", userId: "6", date: "2025-03-15", checkIn: "09:05", checkOut: "17:20", status: "Present" }
];

export interface Leave {
  _id: string;
  userId: string;
  type: 'Sick' | 'Casual' | 'Earned';
  from: string;
  to: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
  approvedBy?: string;
}

export const mockLeaves: Leave[] = [
  { _id: "1", userId: "4", type: "Sick", from: "2025-03-20", to: "2025-03-21", status: "Pending", reason: "Fever" },
  { _id: "2", userId: "5", type: "Casual", from: "2025-03-25", to: "2025-03-25", status: "Approved", reason: "Personal work", approvedBy: "2" },
  { _id: "3", userId: "6", type: "Earned", from: "2025-04-01", to: "2025-04-03", status: "Pending", reason: "Family vacation" }
];

export interface Payslip {
  _id: string;
  userId: string;
  month: string;
  basic: number;
  hra: number;
  gross: number;
  pf: number;
  proTax: number;
  lop: number;
  netPay: number;
}

export const mockPayslips: Payslip[] = [
  {
    _id: "1",
    userId: "4",
    month: "2025-03",
    basic: 60000,
    hra: 24000,
    gross: 84000,
    pf: 7200,
    proTax: 200,
    lop: 3818,
    netPay: 72782
  },
  {
    _id: "2",
    userId: "5",
    month: "2025-03",
    basic: 55000,
    hra: 22000,
    gross: 77000,
    pf: 6600,
    proTax: 200,
    lop: 0,
    netPay: 70200
  }
];
