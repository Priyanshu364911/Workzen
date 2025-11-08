import { forwardRef } from 'react';
import { Payslip } from '@/data/mockData';
import { User } from '@/context/AuthContext';

interface PayslipPrintProps {
  payslip: Payslip;
  employee: User;
}

const PayslipPrint = forwardRef<HTMLDivElement, PayslipPrintProps>(
  ({ payslip, employee }, ref) => {
    const formatMonth = (monthStr: string) => {
      const date = new Date(monthStr + '-01');
      return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    };

    return (
      <div ref={ref} className="bg-white p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-[#7CB342] pb-4">
          <h1 className="text-3xl font-bold text-[#7CB342] mb-2">WorkZen</h1>
          <p className="text-gray-600">Payslip for {formatMonth(payslip.month)}</p>
        </div>

        {/* Employee Details */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Employee Name</p>
            <p className="font-semibold text-[#1A1A1A]">{employee.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Employee ID</p>
            <p className="font-semibold text-[#1A1A1A]">{employee._id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-semibold text-[#1A1A1A]">{employee.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Designation</p>
            <p className="font-semibold text-[#1A1A1A]">{employee.role}</p>
          </div>
        </div>

        {/* Earnings */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-[#7CB342]">Earnings</h3>
          <table className="w-full">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="text-left p-2 text-sm font-medium">Component</th>
                <th className="text-right p-2 text-sm font-medium">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2">Basic Salary</td>
                <td className="text-right p-2">{payslip.basic.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2">HRA (40%)</td>
                <td className="text-right p-2">{payslip.hra.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="bg-[#FFFDD0] font-semibold">
                <td className="p-2">Gross Salary</td>
                <td className="text-right p-2">{payslip.gross.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Deductions */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-[#7CB342]">Deductions</h3>
          <table className="w-full">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="text-left p-2 text-sm font-medium">Component</th>
                <th className="text-right p-2 text-sm font-medium">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2">Provident Fund (12%)</td>
                <td className="text-right p-2">{payslip.pf.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2">Professional Tax</td>
                <td className="text-right p-2">{payslip.proTax.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2">Loss of Pay</td>
                <td className="text-right p-2">{payslip.lop.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="bg-[#FFFDD0] font-semibold">
                <td className="p-2">Total Deductions</td>
                <td className="text-right p-2">
                  {(payslip.pf + payslip.proTax + payslip.lop).toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Net Pay */}
        <div className="bg-[#7CB342] text-white p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Net Pay</span>
            <span className="text-2xl font-bold">₹ {payslip.netPay.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
          <p>This is a system-generated payslip and does not require a signature.</p>
        </div>
      </div>
    );
  }
);

PayslipPrint.displayName = 'PayslipPrint';

export default PayslipPrint;
