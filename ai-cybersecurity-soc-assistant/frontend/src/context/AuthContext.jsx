import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('soc_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('soc_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authService.getMe();
        if (res?.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('soc_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error('Session validation error:', err);
        localStorage.removeItem('soc_token');
        localStorage.removeItem('soc_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    const { token, user: loggedUser } = res.data;
    localStorage.setItem('soc_token', token);
    localStorage.setItem('soc_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    const { token, user: newUser } = res.data;
    localStorage.setItem('soc_token', token);
    localStorage.setItem('soc_user', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('soc_token');
    localStorage.removeItem('soc_user');
    setUser(null);
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
