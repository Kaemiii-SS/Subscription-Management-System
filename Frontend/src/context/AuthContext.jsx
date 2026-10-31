import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS, initializeStorage, getStoredData } from '../lib/storage';
import { authApi } from '../api/auth';
import { ROLES } from '../constants/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeStorage();
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

    if (storedToken && storedUser && !storedToken.startsWith('jwt_mock_')) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const signup = async (formData) => {
    const data = await authApi.signup(formData);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    authApi.logout();
    setToken(null);
    setUser(null);
  };

  // Helper for fast switcher during demo (Admin / Staff / Customer)
  const switchDemoRole = async (role) => {
    let email = 'admin@brightloop.com';
    if (role === ROLES.STAFF) email = 'staff@brightloop.com';
    if (role === ROLES.CUSTOMER) email = 'customer@acme.com';
    try {
      const data = await authApi.login({ email, password: 'Password123!' });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (e) {
      console.warn('Backend login switch failed, falling back to local user', e);
      const users = getStoredData(STORAGE_KEYS.USERS);
      const targetUser = users.find((u) => u.role === role);
      if (targetUser) {
        setUser(targetUser);
        return targetUser;
      }
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    signup,
    logout,
    switchDemoRole,
    isAdmin: user?.role === ROLES.ADMIN,
    isStaff: user?.role === ROLES.STAFF,
    isCustomer: user?.role === ROLES.CUSTOMER,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
