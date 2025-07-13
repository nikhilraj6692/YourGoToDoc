import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import tokenService from '../services/tokenService';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  redirectTo = '/login',
  allowUnauthenticated = false 
}) => {
  const { user, loading } = useUser();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // Check if user is authenticated
  const isAuthenticated = tokenService.isAuthenticated() && user;

  // If route allows unauthenticated access, render children
  if (allowUnauthenticated) {
    return children;
  }

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${redirectTo}?redirect=${returnUrl}`} replace />;
  }

  // If role is required, check if user has the required role
  if (requiredRole && user.role !== requiredRole) {
    console.log(`🚫 Access denied: User role ${user.role} cannot access ${requiredRole} route`);
    
    // Redirect to appropriate dashboard based on user role
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
    
    return <Navigate to={dashboardUrl} replace />;
  }

  // User is authenticated and has required role (if any), render children
  return children;
};

export default ProtectedRoute; 