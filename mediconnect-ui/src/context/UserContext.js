import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile, logout } from '../utils/api';
import tokenService from '../services/tokenService';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = async () => {
    try {
      if (!tokenService.isAuthenticated()) {
        setUser(null);
        setLoading(false);
        return;
      }

      const profile = await getProfile();
      // Only store essential information
      setUser({
        id: profile.id,
        name: profile.fullName,
        email: profile.email,
        role: profile.role
      });
      setError(null);
    } catch (err) {
      console.log('Profile fetch failed:', err.message);
      setError(err.message);
      
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

  const handleLogout = () => {
    setUser(null);
    setError(null);
    tokenService.clearTokens();
    logout();
  };

  const value = {
    user,
    loading,
    error,
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