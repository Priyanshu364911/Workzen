import { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'Admin' | 'HR Officer' | 'Payroll Officer' | 'Employee';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  basicSalary: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  register: (userData: Omit<User, '_id'> & { password: string }) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string): boolean => {
    // Import mock users (in real app, this would be an API call)
    const mockUsers = [
      { _id: "1", name: "Admin User", email: "admin@workzen.com", role: "Admin" as Role, basicSalary: 100000 },
      { _id: "2", name: "Priya HR", email: "hr@workzen.com", role: "HR Officer" as Role, basicSalary: 80000 },
      { _id: "3", name: "Raj Payroll", email: "payroll@workzen.com", role: "Payroll Officer" as Role, basicSalary: 75000 },
      { _id: "4", name: "Amit Kumar", email: "amit@workzen.com", role: "Employee" as Role, basicSalary: 60000 },
      { _id: "5", name: "Sneha Singh", email: "sneha@workzen.com", role: "Employee" as Role, basicSalary: 55000 }
    ];

    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('workzen_user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('workzen_user');
  };

  const register = (userData: Omit<User, '_id'> & { password: string }): boolean => {
    // In real app, this would call API
    const newUser: User = {
      _id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      role: userData.role,
      basicSalary: userData.basicSalary
    };
    
    setUser(newUser);
    localStorage.setItem('workzen_user', JSON.stringify(newUser));
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
