import { mockAttendance, mockLeaves } from '@/data/mockData';

export interface PayrollCalculation {
  basic: number;
  hra: number;
  gross: number;
  pf: number;
  proTax: number;
  lop: number;
  netPay: number;
}

export const calculatePayroll = (
  userId: string,
  basicSalary: number,
  month: string
): PayrollCalculation => {
  const basic = basicSalary;
  const hra = basic * 0.4; // 40% of basic
  const gross = basic + hra;
  const pf = basic * 0.12; // 12% of basic
  const proTax = 200;

  // Calculate present days and approved leaves
  const monthAttendance = mockAttendance.filter(
    a => a.userId === userId && a.date.startsWith(month)
  );
  const presentDays = monthAttendance.filter(a => a.status === 'Present').length;
  
  const monthLeaves = mockLeaves.filter(
    l => l.userId === userId && 
    l.status === 'Approved' &&
    l.from.startsWith(month)
  );
  const approvedLeaveDays = monthLeaves.reduce((sum, leave) => {
    const from = new Date(leave.from);
    const to = new Date(leave.to);
    const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return sum + days;
  }, 0);

  // LOP calculation: (22 - Present - Approved Leaves) × (Gross / 22)
  const workingDays = 22;
  const absentDays = Math.max(0, workingDays - presentDays - approvedLeaveDays);
  const lop = (absentDays * gross) / workingDays;

  const netPay = gross - pf - proTax - lop;

  return {
    basic: Math.round(basic),
    hra: Math.round(hra),
    gross: Math.round(gross),
    pf: Math.round(pf),
    proTax,
    lop: Math.round(lop),
    netPay: Math.round(netPay)
  };
};
