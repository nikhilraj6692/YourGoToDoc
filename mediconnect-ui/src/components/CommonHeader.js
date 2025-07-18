import React from 'react';
import '../styles/Common.css';

const CommonHeader = ({ user, activeTab, onMenuClick, onLogout, menuItems }) => {
  return (
    <div className="common-header">
      <div className="header-container">
        <div className="header-logo">
          <span className="logo-icon">⚕️</span>
          <span className="logo-text">MediConnect</span>
        </div>
        
        <div className="header-menu">
          {menuItems && menuItems.map(item => (
            <button
              key={item.id}
              className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onMenuClick(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="header-right">
          <button className="notification-bell" onClick={() => onMenuClick('notifications')}>
            <img src="/images/bell.jpg" alt="Notifications" className="bell-icon" />
            <span className="notification-counter">11</span>
          </button>
          <div className="user-profile-mini">
            <div className="user-info">
              <span className="user-greeting">Hello, {user?.name?.split(' ')[0] || user?.fullName?.split(' ')[0] || 'User'}</span>
              <span className="user-account">Manage your account</span>
            </div>
          </div>
          <button className="plain-btn logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommonHeader; 