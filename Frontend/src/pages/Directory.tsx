import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { mockUsers } from '@/data/mockData';
import { Mail, UserCircle } from 'lucide-react';

const Directory = () => {
  const { user } = useAuth();
  const canViewSalary = user?.role !== 'Employee';

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Employee Directory</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockUsers.map((employee) => (
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
                  <span className="px-2 py-1 bg-accent rounded text-xs font-medium text-accent-foreground">
                    ID: {employee._id}
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
