import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AuthService from '@/services/authService';

export type Role = 'Admin' | 'HR Officer' | 'Payroll Officer' | 'Employee';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  basicSalary: number;
  department?: string;
  position?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, '_id'> & { password: string }) => Promise<boolean>;
  registerUser: (userData: Omit<User, '_id'> & { password: string }) => Promise<User>;
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
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = AuthService.getStoredUser();
        const storedToken = AuthService.getStoredToken();

        if (storedUser && storedToken) {
          // Verify token is still valid
          try {
            const verifiedUser = await AuthService.verifyToken();
            setUser(verifiedUser);
          } catch (error) {
            // Token is invalid, clear storage
            localStorage.removeItem('workzen_token');
            localStorage.removeItem('workzen_user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const authResponse = await AuthService.login({ email, password });
      setUser(authResponse.user);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AuthService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setUser(null);
    }
  };

  const register = async (userData: Omit<User, '_id'> & { password: string }): Promise<boolean> => {
    try {
      const authResponse = await AuthService.register(userData);
      setUser(authResponse.user);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  // Register a new user without changing current session (for admin use)
  const registerUser = async (userData: Omit<User, '_id'> & { password: string }): Promise<User> => {
    try {
      const authResponse = await AuthService.register(userData);
      // Don't change the current user session, just return the created user
      return authResponse.user;
    } catch (error) {
      console.error('User registration error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, registerUser }}>
      {children}
    </AuthContext.Provider>
  );
};
