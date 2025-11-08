import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mockPayslips, mockUsers, Payslip } from '@/data/mockData';
import PayslipPrint from '@/components/PayslipPrint';
import { useReactToPrint } from 'react-to-print';
import { FileText, Printer } from 'lucide-react';

const Payslips = () => {
  const { user } = useAuth();
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const handleViewPayslip = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
    setIsDialogOpen(true);
  };

  const filteredPayslips = mockPayslips.filter(p => 
    user?.role === 'Employee' ? p.userId === user._id : true
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Payslips</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPayslips.map((payslip) => {
              const employee = mockUsers.find(u => u._id === payslip.userId);
              return (
                <div key={payslip._id} className="bg-card rounded-lg shadow-sm p-6 border border-border hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{employee?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payslip.month + '-01').toLocaleDateString('en-IN', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gross Pay</span>
                      <span className="font-medium text-foreground">₹ {payslip.gross.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Deductions</span>
                      <span className="font-medium text-destructive">
                        ₹ {(payslip.pf + payslip.proTax + payslip.lop).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex justify-between">
                        <span className="font-semibold text-foreground">Net Pay</span>
                        <span className="font-bold text-lg text-primary">
                          ₹ {payslip.netPay.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleViewPayslip(payslip)}
                    className="w-full"
                    variant="outline"
                  >
                    View Payslip
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Payslip Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Payslip Details</span>
                  <Button onClick={handlePrint} size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </DialogTitle>
              </DialogHeader>
              
              {selectedPayslip && (
                <PayslipPrint
                  ref={printRef}
                  payslip={selectedPayslip}
                  employee={mockUsers.find(u => u._id === selectedPayslip.userId)!}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Payslips;
