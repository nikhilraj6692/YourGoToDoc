import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import tokenService from '../services/tokenService';
import LoadingSpinner from './LoadingSpinner';

const PublicRoute = ({ children }) => {
  const { user, loading } = useUser();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // If user is authenticated, redirect to appropriate dashboard
  if (tokenService.isAuthenticated() && user) {
    let dashboardUrl = '/dashboard';
    switch (user.role) {
      case 'DOCTOR':
        dashboardUrl = '/doctor/dashboard';
        break;
      case 'PATIENT':
        dashboardUrl = '/patient/dashboard';
        break;
      case 'ADMIN':
        dashboardUrl = '/admin/dashboard';
        break;
      default:
        dashboardUrl = '/dashboard';
    }
    
    console.log(`🔄 Authenticated user redirected to ${dashboardUrl}`);
    return <Navigate to={dashboardUrl} replace />;
  }

  // User is not authenticated, render the public route
  return children;
};

export default PublicRoute; 