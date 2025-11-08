import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  Calendar, 
  Users, 
  DollarSign, 
  FileText,
  UserPlus,
  LogOut
} from 'lucide-react';
import { useAuth, Role } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'HR Officer', 'Payroll Officer', 'Employee'] },
    { name: 'Attendance', href: '/attendance', icon: Clock, roles: ['Admin', 'HR Officer', 'Payroll Officer', 'Employee'] },
    { name: 'Leaves', href: '/leaves', icon: Calendar, roles: ['Admin', 'HR Officer', 'Payroll Officer', 'Employee'] },
    { name: 'Employees', href: '/employees', icon: Users, roles: ['Admin', 'HR Officer', 'Payroll Officer', 'Employee'] },
    { name: 'Run Payroll', href: '/payroll/run', icon: DollarSign, roles: ['Admin', 'Payroll Officer'] },
    { name: 'Payslips', href: '/payslips', icon: FileText, roles: ['Admin', 'HR Officer', 'Payroll Officer', 'Employee'] },
    { name: 'Register User', href: '/register', icon: UserPlus, roles: ['Admin'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    user && item.roles.includes(user.role as Role)
  );

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold text-primary">WorkZen</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User info & Logout */}
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 rounded-lg bg-accent p-3">
          <p className="text-sm font-medium text-accent-foreground">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
