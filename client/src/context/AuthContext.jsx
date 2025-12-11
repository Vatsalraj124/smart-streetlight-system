import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // For now, set mock user
          const mockUser = {
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            role: 'citizen'
          };
          setUser(mockUser);
          localStorage.setItem('user', JSON.stringify(mockUser));
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setError('');
    try {
      // For now, use mock login - replace with actual API call later
      console.log('Login attempt:', { email, password });
      
      const mockUser = {
        id: 'user-' + Date.now(),
        email,
        name: email.split('@')[0],
        role: 'citizen'
      };
      
      const mockToken = 'mock-jwt-token-' + Date.now();
      
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      return { success: true, data: { user: mockUser, token: mockToken } };
    } catch (error) {
      setError(error.message || 'Login failed');
      return { success: false, message: error.message };
    }
  };

  const register = async (userData) => {
    setError('');
    try {
      // For now, use mock registration - replace with actual API call later
      console.log('Register attempt:', userData);
      
      const mockUser = {
        id: 'user-' + Date.now(),
        name: userData.name,
        email: userData.email,
        role: userData.role || 'citizen'
      };
      
      const mockToken = 'mock-jwt-token-' + Date.now();
      
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      return { success: true, data: { user: mockUser, token: mockToken } };
    } catch (error) {
      setError(error.message || 'Registration failed');
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError('');
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    clearError: () => setError('')
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};