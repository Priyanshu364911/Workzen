import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Users, Calendar, FileText, Clock } from 'lucide-react';
import { mockUsers, mockLeaves, mockPayslips, mockAttendance } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    { 
      name: 'Total Employees', 
      value: mockUsers.length, 
      icon: Users,
      color: 'bg-primary'
    },
    { 
      name: 'Pending Leaves', 
      value: mockLeaves.filter(l => l.status === 'Pending').length, 
      icon: Calendar,
      color: 'bg-secondary'
    },
    { 
      name: 'Payslips Generated', 
      value: mockPayslips.length, 
      icon: FileText,
      color: 'bg-accent'
    },
    { 
      name: 'Present Today', 
      value: mockAttendance.filter(a => a.status === 'Present').length, 
      icon: Clock,
      color: 'bg-primary'
    }
  ];

  // Chart data - employee count by role
  const chartData = [
    { role: 'Admin', count: mockUsers.filter(u => u.role === 'Admin').length },
    { role: 'HR', count: mockUsers.filter(u => u.role === 'HR Officer').length },
    { role: 'Payroll', count: mockUsers.filter(u => u.role === 'Payroll Officer').length },
    { role: 'Employee', count: mockUsers.filter(u => u.role === 'Employee').length }
  ];

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
            <h2 className="text-xl font-semibold mb-4 text-foreground">Recent Leave Requests</h2>
            <div className="space-y-3">
              {mockLeaves.slice(0, 3).map((leave) => {
                const employee = mockUsers.find(u => u._id === leave.userId);
                return (
                  <div key={leave._id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <div>
                      <p className="font-medium text-accent-foreground">{employee?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {leave.type} Leave • {leave.from} to {leave.to}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      leave.status === 'Approved' ? 'bg-primary/20 text-primary' :
                      leave.status === 'Rejected' ? 'bg-destructive/20 text-destructive' :
                      'bg-secondary/20 text-secondary'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
