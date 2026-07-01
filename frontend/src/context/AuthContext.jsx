import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const TOKEN_KEY = 'mawana_admin_token';
const USER_KEY = 'mawana_admin_user';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(true);

  // Validate the stored token once on mount; clear it if the backend rejects it.
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    let active = true;
    axios
      .get(`${BACKEND_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${stored}` } })
      .then((res) => {
        if (!active) return;
        setUser(res.data);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data));
      })
      .catch(() => {
        if (!active) return;
        // Token invalid/expired — sign out.
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password });
      const { access_token, user: loggedUser } = res.data;
      if (!access_token) return { ok: false, error: 'Login gagal' };
      localStorage.setItem(TOKEN_KEY, access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
      setToken(access_token);
      setUser(loggedUser);
      return { ok: true, user: loggedUser };
    } catch (error) {
      const detail = error?.response?.data?.detail || 'Email atau password salah';
      return { ok: false, error: detail };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;
  const role = user?.role || null;
  const isAdmin = role === 'owner' || role === 'admin';

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, role, isAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
