import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { mockUsers, mockPayslips, Payslip } from '@/data/mockData';
import { calculatePayroll } from '@/utils/payroll';
import { toast } from 'sonner';
import { DollarSign } from 'lucide-react';

const PayrollRun = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('');
  const [generatedPayslips, setGeneratedPayslips] = useState<Payslip[]>(mockPayslips);

  const handleRunPayroll = () => {
    if (!selectedMonth) {
      toast.error('Please select a month');
      return;
    }

    const newPayslips: Payslip[] = mockUsers
      .filter(u => u.role === 'Employee')
      .map(employee => {
        const calc = calculatePayroll(employee._id, employee.basicSalary, selectedMonth);
        return {
          _id: `${employee._id}-${selectedMonth}`,
          userId: employee._id,
          month: selectedMonth,
          ...calc
        };
      });

    setGeneratedPayslips([...generatedPayslips, ...newPayslips]);
    toast.success(`Payroll processed for ${newPayslips.length} employees!`);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Run Payroll</h1>

          {/* Payroll Form */}
          <div className="bg-card rounded-lg shadow-sm p-8 mb-8 border border-border max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-primary/10 p-4 rounded-full">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Process Monthly Payroll</h2>
                <p className="text-muted-foreground">Generate payslips for all employees</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="month">Select Month</Label>
                <Input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button onClick={handleRunPayroll} className="w-full" size="lg">
                Run Payroll
              </Button>
            </div>

            <div className="mt-6 p-4 bg-accent rounded-lg">
              <h3 className="font-semibold mb-2 text-accent-foreground">Payroll Calculation</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Basic Salary as per employee record</li>
                <li>• HRA: 40% of Basic Salary</li>
                <li>• Gross: Basic + HRA</li>
                <li>• PF: 12% of Basic Salary</li>
                <li>• Professional Tax: ₹200</li>
                <li>• LOP: (22 - Present - Leaves) × (Gross / 22)</li>
                <li>• Net Pay: Gross - PF - Tax - LOP</li>
              </ul>
            </div>
          </div>

          {/* Recent Payroll Runs */}
          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Recent Payroll Runs</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Gross Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Net Pay</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {generatedPayslips.map((payslip) => {
                    const employee = mockUsers.find(u => u._id === payslip.userId);
                    const totalDeductions = payslip.pf + payslip.proTax + payslip.lop;
                    return (
                      <tr key={payslip._id} className="hover:bg-accent/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {employee?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(payslip.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          ₹ {payslip.gross.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-destructive">
                          ₹ {totalDeductions.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary">
                          ₹ {payslip.netPay.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollRun;
