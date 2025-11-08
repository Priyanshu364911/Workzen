import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { mockLeaves, mockUsers, Leave } from '@/data/mockData';
import { toast } from 'sonner';

const Leaves = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>(mockLeaves);
  const [formData, setFormData] = useState({
    type: '' as Leave['type'] | '',
    from: '',
    to: '',
    reason: ''
  });

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.from || !formData.to || !formData.reason) {
      toast.error('Please fill in all fields');
      return;
    }

    const newLeave: Leave = {
      _id: Date.now().toString(),
      userId: user!._id,
      type: formData.type as Leave['type'],
      from: formData.from,
      to: formData.to,
      status: 'Pending',
      reason: formData.reason
    };

    setLeaves([...leaves, newLeave]);
    toast.success('Leave application submitted successfully!');
    setFormData({ type: '', from: '', to: '', reason: '' });
  };

  const handleLeaveAction = (leaveId: string, action: 'Approved' | 'Rejected') => {
    setLeaves(leaves.map(l => 
      l._id === leaveId 
        ? { ...l, status: action, approvedBy: user!._id }
        : l
    ));
    toast.success(`Leave ${action.toLowerCase()} successfully!`);
  };

  const canApprove = user?.role === 'Admin' || user?.role === 'HR Officer' || user?.role === 'Payroll Officer';

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Leave Management</h1>

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
                      onValueChange={(value) => setFormData({ ...formData, type: value as Leave['type'] })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sick">Sick Leave</SelectItem>
                        <SelectItem value="Casual">Casual Leave</SelectItem>
                        <SelectItem value="Earned">Earned Leave</SelectItem>
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
                  />
                </div>

                <Button type="submit">Submit Application</Button>
              </form>
            </div>
          )}

          {/* Leave Requests Table */}
          <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {user?.role === 'Employee' ? 'My Leave Requests' : 'Leave Requests'}
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">From</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    {canApprove && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {leaves
                    .filter(l => user?.role === 'Employee' ? l.userId === user._id : true)
                    .map((leave) => {
                      const employee = mockUsers.find(u => u._id === leave.userId);
                      return (
                        <tr key={leave._id} className="hover:bg-accent/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {employee?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{leave.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(leave.from).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(leave.to).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
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
                                    onClick={() => handleLeaveAction(leave._id, 'Approved')}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleLeaveAction(leave._id, 'Rejected')}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </td>
                          )}
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

export default Leaves;
