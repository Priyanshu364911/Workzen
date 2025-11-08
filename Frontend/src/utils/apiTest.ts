// Simple API test utility for debugging
import { apiClient } from '../services/api';

export class ApiTest {
  /**
   * Test if the backend is reachable
   */
  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:5000/health');
      return response.ok;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  }

  /**
   * Test authentication
   */
  static async testAuth(): Promise<boolean> {
    try {
      const token = localStorage.getItem('workzen_token');
      if (!token) {
        console.log('No token found');
        return false;
      }

      const response = await apiClient.get('/auth/verify');
      return response.success;
    } catch (error) {
      console.error('Auth test failed:', error);
      return false;
    }
  }

  /**
   * Test dashboard endpoint
   */
  static async testDashboard(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard');
      console.log('Dashboard response:', response);
      return response;
    } catch (error) {
      console.error('Dashboard test failed:', error);
      throw error;
    }
  }

  /**
   * Run all tests
   */
  static async runAllTests(): Promise<void> {
    console.log('🧪 Running API Tests...');
    
    // Test 1: Backend connection
    const connectionOk = await this.testConnection();
    console.log(`📡 Backend Connection: ${connectionOk ? '✅' : '❌'}`);
    
    if (!connectionOk) {
      console.log('❌ Backend is not running. Please start the backend server.');
      return;
    }

    // Test 2: Authentication
    const authOk = await this.testAuth();
    console.log(`🔐 Authentication: ${authOk ? '✅' : '❌'}`);
    
    if (!authOk) {
      console.log('❌ Authentication failed. Please login first.');
      return;
    }

    // Test 3: Dashboard endpoint
    try {
      await this.testDashboard();
      console.log('📊 Dashboard Endpoint: ✅');
    } catch (error) {
      console.log('📊 Dashboard Endpoint: ❌');
    }

    console.log('🧪 API Tests Complete');
  }
}

// Auto-run tests in development
if (import.meta.env.DEV) {
  // Run tests after a short delay to allow app to initialize
  setTimeout(() => {
    ApiTest.runAllTests();
  }, 2000);
}