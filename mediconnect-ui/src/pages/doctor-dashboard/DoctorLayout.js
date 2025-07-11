import React from 'react';
import { useNavigate } from 'react-router-dom';
import CommonHeader from '../../components/CommonHeader';
import { useUser } from '../../context/UserContext';

const DoctorLayout = ({ children, activeTab = 'dashboard' }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  
  // Menu items for all doctor pages
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'patients', label: 'Patients' },
    { id: 'messages', label: 'Messages' },
    { id: 'schedule', label: 'Schedule' }
  ];

  const handleMenuClick = (menuId) => {
    // Navigate to the appropriate page
    switch (menuId) {
      case 'dashboard':
        navigate('/doctor/dashboard');
        break;
      case 'appointments':
        navigate('/doctor/appointments');
        break;
      case 'patients':
        navigate('/doctor/patients');
        break;
      case 'messages':
        navigate('/doctor/messages');
        break;
      case 'schedule':
        navigate('/doctor/schedule');
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const userInfo = {
    name: user?.name,
    fullName: user?.fullName,
    role: user?.role
  };

  return (
    <div>
      <CommonHeader 
        user={userInfo}
        activeTab={activeTab}
        onMenuClick={handleMenuClick}
        onLogout={handleLogout}
        menuItems={menuItems}
      />
      {children}
    </div>
  );
};

export default DoctorLayout; 