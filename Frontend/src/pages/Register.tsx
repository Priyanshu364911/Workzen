import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, Role } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '' as Role | '',
    basicSalary: ''
  });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.role || !formData.basicSalary) {
      toast.error('Please fill in all fields');
      return;
    }

    const success = register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role as Role,
      basicSalary: parseFloat(formData.basicSalary)
    });

    if (success) {
      toast.success('User registered successfully!');
      navigate('/employees');
    } else {
      toast.error('Registration failed');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Register New User</h1>

          <div className="max-w-2xl bg-card rounded-lg shadow-lg p-8 border border-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@workzen.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => setFormData({ ...formData, role: value as Role })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="HR Officer">HR Officer</SelectItem>
                      <SelectItem value="Payroll Officer">Payroll Officer</SelectItem>
                      <SelectItem value="Employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="salary">Basic Salary (₹)</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                    placeholder="50000"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1">
                  Register User
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/employees')}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
