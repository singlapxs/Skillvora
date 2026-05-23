import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create a configured axios instance
export const api = axios.create({
  baseURL: API_URL
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Set default bearer authorization header
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.user);
            setToken(storedToken);
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error('[Auth Context] Session restoration failed:', error.message);
          handleLogout();
        }
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Update loading once user state is loaded or cleared
  useEffect(() => {
    if (user || !token) {
      setLoading(false);
    }
  }, [user, token]);

  const handleLogin = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const receivedToken = response.data.token;
        const receivedUser = response.data.user;

        localStorage.setItem('token', receivedToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;
        
        setToken(receivedToken);
        setUser(receivedUser);
        return { success: true, user: receivedUser };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message };
    }
  };

  const handleRegister = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      if (response.data.success) {
        // If they were automatically logged in (e.g. initial boot admin account)
        if (response.data.token) {
          const receivedToken = response.data.token;
          const receivedUser = response.data.user;

          localStorage.setItem('token', receivedToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;
          
          setToken(receivedToken);
          setUser(receivedUser);
          return { success: true, autoLogin: true, user: receivedUser };
        }
        return { success: true, autoLogin: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
    setLoading(false);
  };

  const value = {
    user,
    token,
    loading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
