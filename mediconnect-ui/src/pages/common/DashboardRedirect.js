import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const DashboardRedirect = () => {
  const navigate = useNavigate();
  const { user, loading } = useUser();

  useEffect(() => {
    // Wait for user context to load
    if (loading) return;

    // Redirect based on user role
    if (user && user.role === 'DOCTOR') {
      navigate('/doctor/dashboard', { replace: true });
    } else if (user && user.role === 'PATIENT') {
      navigate('/patient/dashboard', { replace: true });
    } else if (user && user.role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      // No user or unknown role, redirect to login
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading spinner while determining redirect
  return (
    <LoadingSpinner />
  );
};

export default DashboardRedirect; 