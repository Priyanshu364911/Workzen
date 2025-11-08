import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle } from 'lucide-react';
import LeaveService, { LeaveApplication, LeaveBalance } from '@/services/leaveService';
import { useToast } from '@/hooks/use-toast';

const Leaves = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: '',
    from: '',
    to: '',
    reason: ''
  });

  useEffect(() => {
    fetchLeaves();
    if (user?.role === 'Employee') {
      fetchLeaveBalance();
    }
  }, [user]);

  const fetchLeaves = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = user?.role === 'Employee' ? { userId: user._id } : {};
      const response = await LeaveService.getLeaves(params);
      
      if (response.success) {
        setLeaves(response.data.leaves);
      } else {
        throw new Error('Failed to fetch leaves');
      }
    } catch (error: any) {
      console.error('Leaves fetch error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to load leave data';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const response = await LeaveService.getLeaveBalance();
      if (response.success) {
        setLeaveBalance(response.data.balance);
      }
    } catch (error: any) {
      console.error('Leave balance fetch error:', error);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.from || !formData.to || !formData.reason) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await LeaveService.applyLeave(formData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        });
        setFormData({ type: '', from: '', to: '', reason: '' });
        await fetchLeaves();
        if (user?.role === 'Employee') {
          await fetchLeaveBalance();
        }
      }
    } catch (error: any) {
      console.error('Leave application error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to submit leave application';
      toast({
        title: "Application Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveAction = async (leaveId: string, action: 'approve' | 'reject', reviewComments?: string) => {
    try {
      const response = action === 'approve' 
        ? await LeaveService.approveLeave(leaveId, reviewComments)
        : await LeaveService.rejectLeave(leaveId, reviewComments);
      
      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        });
        await fetchLeaves();
      }
    } catch (error: any) {
      console.error('Leave action error:', error);
      const errorMessage = error.response?.data?.error?.message || `Failed to ${action} leave`;
      toast({
        title: "Action Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const canApprove = user?.role === 'Admin' || user?.role === 'HR Officer' || user?.role === 'Payroll Officer';

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading leave data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Leave Management</h1>

          {/* Leave Balance Card for Employees */}
          {user?.role === 'Employee' && leaveBalance && (
            <div className="bg-card rounded-lg shadow-sm p-6 mb-8 border border-border">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Leave Balance ({leaveBalance.year})</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{leaveBalance.remainingSickLeave}</p>
                  <p className="text-sm text-muted-foreground">Sick Leave</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{leaveBalance.remainingCasualLeave}</p>
                  <p className="text-sm text-muted-foreground">Casual Leave</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{leaveBalance.remainingEarnedLeave}</p>
                  <p className="text-sm text-muted-foreground">Earned Leave</p>
                </div>
              </div>
            </div>
          )}

          {/* Apply Leave Form */}
          {user?.role === 'Employee' && (
            <div className="bg-card rounded-lg shadow-sm p-6 mb-8 border border-border">
              <h2 className="text-xl font-semibold mb-6 text-foreground">Apply for Leave</h2>
              
              <form onSubmit={handleApplyLeave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Leave Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sick">Sick Leave</SelectItem>
                        <SelectItem value="Casual">Casual Leave</SelectItem>
                        <SelectItem value="Earned">Earned Leave</SelectItem>
                        <SelectItem value="Maternity">Maternity Leave</SelectItem>
                        <SelectItem value="Paternity">Paternity Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="from">From</Label>
                      <Input
                        id="from"
                        type="date"
                        value={formData.from}
                        onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                        className="mt-1"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <Label htmlFor="to">To</Label>
                      <Input
                        id="to"
                        type="date"
                        value={formData.to}
                        onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                        className="mt-1"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Enter reason for leave..."
                    className="mt-1"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Leave Requests Table */}
          <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {user?.role === 'Employee' ? 'My Leave Requests' : 'Leave Requests'}
              </h2>
              {error && (
                <div className="mt-2 flex items-center text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    {user?.role !== 'Employee' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Employee</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">From</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    {canApprove && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={user?.role === 'Employee' ? (canApprove ? 7 : 6) : (canApprove ? 8 : 7)} className="px-6 py-8 text-center text-muted-foreground">
                        No leave requests found
                      </td>
                    </tr>
                  ) : (
                    leaves.map((leave) => (
                      <tr key={leave._id} className="hover:bg-accent/50">
                        {user?.role !== 'Employee' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {leave.user?.name || 'Unknown'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{leave.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(leave.from).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(leave.to).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {leave.totalDays}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate" title={leave.reason}>
                          {leave.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            leave.status === 'Approved' ? 'bg-primary/20 text-primary' :
                            leave.status === 'Rejected' ? 'bg-destructive/20 text-destructive' :
                            'bg-secondary/20 text-secondary'
                          }`}>
                            {leave.status}
                          </span>
                        </td>
                        {canApprove && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {leave.status === 'Pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleLeaveAction(leave._id, 'approve')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleLeaveAction(leave._id, 'reject')}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaves;
