import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { mockAttendance, mockUsers } from '@/data/mockData';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';

const Attendance = () => {
  const { user } = useAuth();
  const [attendanceData] = useState(mockAttendance);
  const today = new Date().toISOString().split('T')[0];

  const handleCheckIn = () => {
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    toast.success(`Checked in at ${now}`);
  };

  const handleCheckOut = () => {
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    toast.success(`Checked out at ${now}`);
  };

  const todayAttendance = attendanceData.find(
    a => a.userId === user?._id && a.date === today
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Attendance</h1>

          {/* Employee Check-in/out */}
          {user?.role === 'Employee' && (
            <div className="bg-card rounded-lg shadow-sm p-8 mb-8 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">Mark Attendance</h2>
                  <p className="text-muted-foreground">Today: {new Date().toLocaleDateString('en-IN')}</p>
                </div>
                <Clock className="h-12 w-12 text-primary" />
              </div>
              
              <div className="mt-6 flex gap-4">
                <Button 
                  onClick={handleCheckIn}
                  disabled={!!todayAttendance?.checkIn}
                  className="flex-1"
                >
                  Check In
                </Button>
                <Button 
                  onClick={handleCheckOut}
                  disabled={!todayAttendance?.checkIn || !!todayAttendance?.checkOut}
                  variant="secondary"
                  className="flex-1"
                >
                  Check Out
                </Button>
              </div>

              {todayAttendance && (
                <div className="mt-4 p-4 bg-accent rounded-lg">
                  <p className="text-sm text-accent-foreground">
                    {todayAttendance.checkIn && `Checked in: ${todayAttendance.checkIn}`}
                    {todayAttendance.checkOut && ` • Checked out: ${todayAttendance.checkOut}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Attendance Table */}
          <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Attendance Records</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {attendanceData
                    .filter(a => user?.role === 'Employee' ? a.userId === user._id : true)
                    .map((record) => {
                      const employee = mockUsers.find(u => u._id === record.userId);
                      return (
                        <tr key={record._id} className="hover:bg-accent/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {employee?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(record.date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {record.checkIn || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {record.checkOut || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              record.status === 'Present' ? 'bg-primary/20 text-primary' :
                              record.status === 'Absent' ? 'bg-destructive/20 text-destructive' :
                              'bg-secondary/20 text-secondary'
                            }`}>
                              {record.status}
                            </span>
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

export default Attendance;
