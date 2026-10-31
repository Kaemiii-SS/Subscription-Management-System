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

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } else {
      // Default initial mock login for smooth local demo testing: Admin
      const users = getStoredData(STORAGE_KEYS.USERS);
      const defaultAdmin = users.find((u) => u.role === ROLES.ADMIN) || users[0];
      if (defaultAdmin) {
        const mockToken = `jwt_mock_admin_${defaultAdmin.id}`;
        localStorage.setItem(STORAGE_KEYS.TOKEN, mockToken);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultAdmin));
        setToken(mockToken);
        setUser(defaultAdmin);
      }
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
  const switchDemoRole = (role) => {
    const users = getStoredData(STORAGE_KEYS.USERS);
    const targetUser = users.find((u) => u.role === role);
    if (targetUser) {
      const mockToken = `jwt_mock_${role}_${targetUser.id}`;
      localStorage.setItem(STORAGE_KEYS.TOKEN, mockToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(targetUser));
      setToken(mockToken);
      setUser(targetUser);
      return targetUser;
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
