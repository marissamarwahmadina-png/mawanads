import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

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
    // Check if user is already logged in (from localStorage)
    const authToken = localStorage.getItem('mawana_admin_auth');
    if (authToken === 'authenticated') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (password) => {
    // Simple password check (you can change this password)
    const ADMIN_PASSWORD = 'mawana2025admin'; // ⚠️ CHANGE THIS PASSWORD!
    
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('mawana_admin_auth', 'authenticated');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('mawana_admin_auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
