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
  const [token, setToken] = useState(() => localStorage.getItem('mawana_admin_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('mawana_admin_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has valid token
    const stored = localStorage.getItem('mawana_admin_token');
    if (stored) {
      setToken(stored);
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
        setToken(response.data.access_token);
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
    setToken(null);
    localStorage.removeItem('mawana_admin_token');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
