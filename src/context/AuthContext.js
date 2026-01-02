import React, { createContext, useState, useEffect } from 'react';
import api from '../config/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await api.get('/api/auth/me');
      const userData = res.data.user || res.data; // Handle both old and new response formats
      
      // Get stored admin features and security info
      const adminFeatures = JSON.parse(localStorage.getItem('adminFeatures') || 'null');
      const securityInfo = JSON.parse(localStorage.getItem('securityInfo') || 'null');
      
      setUser({
        ...userData,
        adminFeatures: adminFeatures || res.data.adminFeatures,
        securityInfo: securityInfo || res.data.securityInfo
      });
      
      console.log('👤 User profile fetched:', {
        username: userData.username,
        userType: userData.userType,
        hasAdminFeatures: !!(adminFeatures || res.data.adminFeatures)
      });
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('adminFeatures');
      localStorage.removeItem('securityInfo');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      console.log('🔐 Attempting admin login with username:', username);
      
      // Try enhanced admin login endpoint first
      let res;
      try {
        console.log('🚀 Trying enhanced admin login endpoint...');
        res = await api.post('/api/auth/admin-login', { username, password });
        console.log('✅ Enhanced admin login successful:', res.data);
      } catch (adminError) {
        console.log('⚠️ Enhanced admin login failed, trying regular login...');
        // Fallback to regular login endpoint
        res = await api.post('/api/auth/login', { username, password });
        console.log('✅ Regular admin login successful:', res.data);
      }
      
      const { token: newToken, user: userData, adminFeatures, securityInfo } = res.data;
      
      if (!userData) {
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
      
      if (userData.userType !== 'admin') {
        return {
          success: false,
          message: 'Access denied. Administrator privileges required.'
        };
      }

      // Store enhanced admin data
      localStorage.setItem('token', newToken);
      if (adminFeatures) {
        localStorage.setItem('adminFeatures', JSON.stringify(adminFeatures));
      }
      if (securityInfo) {
        localStorage.setItem('securityInfo', JSON.stringify(securityInfo));
      }
      
      setToken(newToken);
      setUser({
        ...userData,
        adminFeatures,
        securityInfo
      });
      
      console.log('🎉 Admin login completed successfully:', {
        username: userData.username,
        userType: userData.userType,
        hasAdminFeatures: !!adminFeatures,
        hasSecurityInfo: !!securityInfo
      });
      
      return { 
        success: true,
        message: res.data.message || 'Login successful',
        adminFeatures,
        securityInfo
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error message:', error.message);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        return {
          success: false,
          message: 'Cannot connect to server. Please check your internet connection and try again.'
        };
      }
      
      // Enhanced error handling
      const errorData = error.response?.data;
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.errors && Array.isArray(errorData.errors)) {
        errorMessage = errorData.errors.map(err => err.msg).join(', ');
      }
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        const lockoutTime = errorData?.lockoutTime || 'some time';
        errorMessage = `Too many failed attempts. Please try again in ${lockoutTime} minutes.`;
      }
      
      return {
        success: false,
        message: errorMessage,
        code: errorData?.code,
        remaining: errorData?.remaining
      };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint if token exists
      if (token) {
        await api.post('/api/auth/logout');
        console.log('✅ Server logout successful');
      }
    } catch (error) {
      console.error('⚠️ Server logout failed (continuing with client logout):', error.message);
    } finally {
      // Always clear client-side data
      localStorage.removeItem('token');
      localStorage.removeItem('adminFeatures');
      localStorage.removeItem('securityInfo');
      setToken(null);
      setUser(null);
      console.log('🚪 Client logout completed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
