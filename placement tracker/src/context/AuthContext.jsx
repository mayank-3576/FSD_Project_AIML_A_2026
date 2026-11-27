import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const defaultAuth = {
  user: null,
  token: null,
  role: null,
  studentProfile: null,
  isAuthenticated: false,
  isStudent: false,
  isOrg: false,
  loading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateStudentProfile: () => {},
};

const AuthContext = createContext(defaultAuth);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('abes_placement_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('abes_placement_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem('abes_placement_token');
      if (storedToken) {
        try {
          const res = await api.get('/users/profile');
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('abes_placement_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session check failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('abes_placement_token', res.token);
      localStorage.setItem('abes_placement_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('abes_placement_token', res.token);
      localStorage.setItem('abes_placement_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('abes_placement_token');
    localStorage.removeItem('abes_placement_user');
  };

  const updateStudentProfile = (updatedProfile) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser = {
        ...prev,
        studentProfile: {
          ...prev.studentProfile,
          ...updatedProfile,
        },
      };
      localStorage.setItem('abes_placement_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    studentProfile: user?.studentProfile || null,
    isAuthenticated: !!token && !!user,
    isStudent: user?.role === 'user',
    isOrg: user?.role === 'organization',
    loading,
    login,
    register,
    logout,
    updateStudentProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context || defaultAuth;
}

export default AuthContext;
