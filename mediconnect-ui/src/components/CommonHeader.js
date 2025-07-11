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
          <div className="user-profile-mini">
            <div className="user-info">
              <span className="user-greeting">Hello, {user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0]}</span>
              <span className="user-account">Manage your account</span>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommonHeader; 