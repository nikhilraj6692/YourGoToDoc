import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Try to get user info from localStorage (after login/signup)
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {}

    if (user && user.role === 'DOCTOR') {
      navigate('/doctor/dashboard', { replace: true });
    } else if( user && user.role === 'PATIENT'){
      navigate('/patient/dashboard', { replace: true });
    } else if( user && user.role === 'ADMIN'){
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  return null; // Optionally, show a spinner
};

export default DashboardRedirect; 