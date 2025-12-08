import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authAPI.me();
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      // If backend is not ready (404), just set user to null
      // This allows the app to work without backend during development
      console.log('Backend not available, continuing without authentication');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    if (response.data.success) {
      setUser(response.data.data);
      return response.data;
    }
    throw new Error(response.data.message);
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    if (response.data.success) {
      setUser(response.data.data);
      return response.data;
    }
    throw new Error(response.data.message);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.me();
      if (response.data.success) {
        setUser(response.data.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isInstructor = user?.role === 'instructor';
  const isStudent = user?.role === 'student';

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAdmin,
    isInstructor,
    isStudent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
