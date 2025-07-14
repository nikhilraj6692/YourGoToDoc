import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile, logout } from '../utils/api';
import tokenService from '../services/tokenService';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Removed error state - using console.log for debugging instead

  const fetchUserProfile = async () => {
    try {
      console.log('🔄 UserContext: fetchUserProfile called');
      console.log('🔍 UserContext: isAuthenticated:', tokenService.isAuthenticated());
      
      if (!tokenService.isAuthenticated()) {
        console.log('❌ UserContext: Not authenticated, setting user to null');
        setUser(null);
        setLoading(false);
        return;
      }

      // First, check if we have user data in localStorage from login
      const storedUser = tokenService.getUser();
      if (storedUser) {
        console.log('👤 UserContext: Found user data in localStorage:', storedUser);
        // Ensure the user data has the correct structure
        const userData = {
          id: storedUser.id,
          name: storedUser.fullName || storedUser.name,
          email: storedUser.email,
          role: storedUser.role
        };
        console.log('👤 UserContext: Setting user data from localStorage:', userData);
        setUser(userData);
        setLoading(false);
        return;
      }

      console.log('📡 UserContext: Fetching profile from API');
      const profile = await getProfile();
      console.log('📦 UserContext: Profile received:', profile);
      
      // Only store essential information
      const userData = {
        id: profile.id,
        name: profile.fullName,
        email: profile.email,
        role: profile.role
      };
      console.log('👤 UserContext: Setting user data:', userData);
      setUser(userData);
    } catch (err) {
      console.log('Profile fetch failed:', err.message);
      
      // Only clear user and redirect for specific authentication errors
      // Don't logout for refresh token failures or temporary network issues
      if (err.message === 'No authentication token found') {
        setUser(null);
        // Don't redirect here as the API utility will handle it
      } else if (err.message.includes('Authentication failed') && 
                 !err.message.includes('Token refresh failed')) {
        setUser(null);
        // Don't redirect here as the API utility will handle it
      } else if (err.message.includes('Token has expired')) {
        setUser(null);
        // Don't redirect here as the API utility will handle it
      }
      // For other errors (like refresh token failures), keep the user logged in
      // and let the access token handle logout when it expires
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Listen for user data updates
  useEffect(() => {
    const handleUserDataUpdate = () => {
      console.log('🔄 UserContext: Received user data update event');
      fetchUserProfile();
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate);

    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate);
    };
  }, []);

  const handleLogout = () => {
    setUser(null);
    tokenService.clearTokens();
    logout();
  };

  const value = {
    user,
    loading,
    refreshProfile: fetchUserProfile,
    logout: handleLogout
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 