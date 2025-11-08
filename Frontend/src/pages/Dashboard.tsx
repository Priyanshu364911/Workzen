import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Users, Calendar, FileText, Clock, Loader2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import DashboardService, { DashboardStats } from '@/services/dashboardService';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await DashboardService.getDashboardData();
        
        if (response.success) {
          setDashboardData(response.data.stats);
        } else {
          throw new Error('Failed to fetch dashboard data');
        }
      } catch (error: any) {
        console.error('Dashboard data fetch error:', error);
        const errorMessage = error.response?.data?.error?.message || 'Failed to load dashboard data';
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

    fetchDashboardData();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{error || 'Failed to load dashboard data'}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      name: 'Total Employees', 
      value: dashboardData.users.total, 
      icon: Users,
      color: 'bg-primary'
    },
    { 
      name: 'Pending Leaves', 
      value: dashboardData.leaves.pending, 
      icon: Calendar,
      color: 'bg-secondary'
    },
    { 
      name: 'Payroll Processed', 
      value: dashboardData.payroll.thisMonth.processed, 
      icon: FileText,
      color: 'bg-accent'
    },
    { 
      name: 'Present Today', 
      value: dashboardData.attendance.today.present, 
      icon: Clock,
      color: 'bg-primary'
    }
  ];

  // Chart data - employee count by role
  const chartData = dashboardData.users.byRole.map(role => ({
    role: role.role,
    count: role.count
  }));

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name}!</h1>
            <p className="text-muted-foreground mt-1">Here's what's happening with your workspace today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div key={stat.name} className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.name}</p>
                    <p className="text-3xl font-bold mt-2 text-foreground">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          {(user?.role === 'Admin' || user?.role === 'HR Officer') && (
            <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <h2 className="text-xl font-semibold mb-6 text-foreground">Employee Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Activity */}
          <div className="mt-8 bg-card rounded-lg shadow-sm p-6 border border-border">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Dashboard Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-accent rounded-lg">
                <h3 className="font-medium text-accent-foreground mb-2">Attendance Today</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Present: {dashboardData.attendance.today.present}</p>
                  <p>Absent: {dashboardData.attendance.today.absent}</p>
                  <p>Late: {dashboardData.attendance.today.late}</p>
                </div>
              </div>
              
              <div className="p-4 bg-accent rounded-lg">
                <h3 className="font-medium text-accent-foreground mb-2">Leave Summary</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Pending: {dashboardData.leaves.pending}</p>
                  <p>This Month: {dashboardData.leaves.thisMonth.total}</p>
                  <p>Approved: {dashboardData.leaves.thisMonth.approved}</p>
                </div>
              </div>
              
              <div className="p-4 bg-accent rounded-lg">
                <h3 className="font-medium text-accent-foreground mb-2">Payroll Status</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Processed: {dashboardData.payroll.thisMonth.processed}</p>
                  <p>Total Net: ₹{dashboardData.payroll.thisMonth.totalNet.toLocaleString()}</p>
                  <p>Avg Salary: ₹{dashboardData.payroll.thisMonth.averageSalary.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
