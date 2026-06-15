import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('vegbot_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      await authAPI.verify();
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('vegbot_token');
      setIsAuthenticated(false);
    }
    setLoading(false);
  }

  async function login(password) {
    const response = await authAPI.login(password);
    localStorage.setItem('vegbot_token', response.data.token);
    setIsAuthenticated(true);
    return response.data;
  }

  function logout() {
    localStorage.removeItem('vegbot_token');
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
