import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Mail, UserCircle, Plus, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserManagementService, { User } from '@/services/userManagementService';
import { useToast } from '@/hooks/use-toast';

const Directory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const canViewSalary = user?.role !== 'Employee';
  const canAddUser = user?.role === 'Admin' || user?.role === 'HR Officer';

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const usersResponse = await UserManagementService.getUsers();
      setEmployees(usersResponse.users);
    } catch (error: any) {
      console.error('Failed to fetch employees:', error);
      const errorMessage = error.message || 'Failed to load employees';
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

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading employees...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchEmployees}>Retry</Button>
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">Employee Directory</h1>
            {canAddUser && (
              <Button onClick={() => navigate('/register')} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <div key={employee._id} className="bg-card rounded-lg shadow-sm p-6 border border-border hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <UserCircle className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{employee.name}</h3>
                    <p className="text-sm text-muted-foreground">{employee.role}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{employee.email}</span>
                  </div>

                  {employee.department && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Department:</strong> {employee.department}
                    </p>
                  )}

                  {employee.position && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Position:</strong> {employee.position}
                    </p>
                  )}

                  {canViewSalary && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">Basic Salary</p>
                      <p className="text-lg font-semibold text-primary">
                        ₹ {employee.basicSalary.toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    employee.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-1 bg-accent rounded text-xs font-medium text-accent-foreground">
                    ID: {employee._id.slice(-6)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Directory;
