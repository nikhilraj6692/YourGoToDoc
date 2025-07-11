import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile } from '../utils/api';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
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
      setError(err.message);
      if (err.message === 'No authentication token found') {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const value = {
    user,
    loading,
    error,
    refreshProfile: fetchUserProfile
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