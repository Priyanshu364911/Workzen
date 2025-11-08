import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Directory from "./pages/Directory";
import PayrollRun from "./pages/PayrollRun";
import Payslips from "./pages/Payslips";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      
      <Route 
        path="/register" 
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Register />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/attendance" 
        element={
          <ProtectedRoute>
            <Attendance />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/leaves" 
        element={
          <ProtectedRoute>
            <Leaves />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/employees" 
        element={
          <ProtectedRoute>
            <Directory />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/payroll/run" 
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Payroll Officer']}>
            <PayrollRun />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/payslips" 
        element={
          <ProtectedRoute>
            <Payslips />
          </ProtectedRoute>
        } 
      />
      
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
