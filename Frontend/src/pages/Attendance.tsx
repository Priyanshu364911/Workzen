import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Clock, Loader2, AlertCircle } from 'lucide-react';
import AttendanceService, { AttendanceRecord, AttendanceStatus } from '@/services/attendanceService';
import { useToast } from '@/hooks/use-toast';

const Attendance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendanceData();
    if (user?.role === 'Employee') {
      fetchAttendanceStatus();
    }
  }, [user]);

  const fetchAttendanceData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = user?.role === 'Employee' ? { userId: user._id } : {};
      const attendanceResponse = await AttendanceService.getAttendanceLogs(params);
      setAttendanceData(attendanceResponse.attendance);
    } catch (error: any) {
      console.error('Attendance fetch error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to load attendance data';
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

  const fetchAttendanceStatus = async () => {
    try {
      const statusResponse = await AttendanceService.getCurrentStatus();
      setAttendanceStatus(statusResponse);
    } catch (error: any) {
      console.error('Attendance status fetch error:', error);
    }
  };

  const handleCheckIn = async () => {
    try {
      setIsCheckingIn(true);
      const response = await AttendanceService.checkIn({});
      
      toast({
        title: "Check-in Successful",
        description: response.message,
      });
      await fetchAttendanceStatus();
      await fetchAttendanceData();
    } catch (error: any) {
      console.error('Check-in error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Check-in failed';
      toast({
        title: "Check-in Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setIsCheckingOut(true);
      const response = await AttendanceService.checkOut({});
      
      toast({
        title: "Check-out Successful",
        description: response.message,
      });
      await fetchAttendanceStatus();
      await fetchAttendanceData();
    } catch (error: any) {
      console.error('Check-out error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Check-out failed';
      toast({
        title: "Check-out Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading attendance data...</p>
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
                  disabled={attendanceStatus?.hasCheckedIn || isCheckingIn}
                  className="flex-1"
                >
                  {isCheckingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking In...
                    </>
                  ) : (
                    'Check In'
                  )}
                </Button>
                <Button 
                  onClick={handleCheckOut}
                  disabled={!attendanceStatus?.hasCheckedIn || attendanceStatus?.hasCheckedOut || isCheckingOut}
                  variant="secondary"
                  className="flex-1"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking Out...
                    </>
                  ) : (
                    'Check Out'
                  )}
                </Button>
              </div>

              {attendanceStatus?.attendance && (
                <div className="mt-4 p-4 bg-accent rounded-lg">
                  <p className="text-sm text-accent-foreground">
                    {attendanceStatus.attendance.checkIn && 
                      `Checked in: ${new Date(attendanceStatus.attendance.checkIn).toLocaleTimeString('en-IN')}`}
                    {attendanceStatus.attendance.checkOut && 
                      ` • Checked out: ${new Date(attendanceStatus.attendance.checkOut).toLocaleTimeString('en-IN')}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {attendanceStatus.attendance.status}
                    {attendanceStatus.attendance.totalHours && 
                      ` • Total Hours: ${attendanceStatus.attendance.totalHours.toFixed(2)}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Attendance Table */}
          <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Attendance Records</h2>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Employee
                      </th>
                    )}
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
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {attendanceData.length === 0 ? (
                    <tr>
                      <td colSpan={user?.role === 'Employee' ? 5 : 6} className="px-6 py-8 text-center text-muted-foreground">
                        No attendance records found
                      </td>
                    </tr>
                  ) : (
                    attendanceData.map((record) => (
                      <tr key={record._id} className="hover:bg-accent/50">
                        {user?.role !== 'Employee' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {record.user?.name || 'Unknown'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(record.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-IN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-IN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {record.totalHours ? `${record.totalHours.toFixed(2)}h` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.status === 'Present' ? 'bg-primary/20 text-primary' :
                            record.status === 'Absent' ? 'bg-destructive/20 text-destructive' :
                            record.status === 'Late' ? 'bg-yellow-500/20 text-yellow-700' :
                            'bg-secondary/20 text-secondary'
                          }`}>
                            {record.status}
                          </span>
                        </td>
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

export default Attendance;
