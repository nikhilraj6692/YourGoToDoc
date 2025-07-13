import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Common.css';

const HomeHeader = () => {
  return (
    <div className="common-header">
      <div className="header-container">
        <div className="header-logo">
          <span className="logo-icon">⚕️</span>
          <span className="logo-text">MediConnect</span>
        </div>
        
        <div className="header-menu">
          {/* Empty menu section for homepage */}
        </div>
        
        <div className="header-right">
          <Link to="/signup" className="plain-btn hollow-dark">Sign Up</Link>
          <Link to="/login" className="plain-btn bright">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default HomeHeader; 