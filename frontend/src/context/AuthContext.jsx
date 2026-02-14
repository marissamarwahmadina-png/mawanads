import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has valid token
    const token = localStorage.getItem('mawana_admin_token');
    if (token) {
      // TODO: Verify token with backend if needed
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (password) => {
    try {
      // Call backend API for authentication
      const response = await axios.post(`${BACKEND_URL}/api/admin/login`, {
        password: password
      });
      
      if (response.data.access_token) {
        setIsAuthenticated(true);
        localStorage.setItem('mawana_admin_token', response.data.access_token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('mawana_admin_token');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
