import React from 'react';
import '../../styles/UnderDev.css';

const Profile = ({ setActiveTab }) => (
  <div className="under-development-container">
    <div className="under-development-content">
      <div className="development-icon">
        🚧
      </div>
      
      <h2 className="development-title">
        Profile Management
      </h2>
      
      <h3 className="development-subtitle">
        Under Development
      </h3>
      
      <p className="development-description">
        We're working hard to bring you an amazing profile management experience. 
        This feature will allow you to update your professional information, upload photos, 
        manage your credentials, and customize your practice details.
      </p>
      
      <div className="development-features">
        <h4>Coming Soon:</h4>
        <ul>
          <li>✨ Profile photo upload and management</li>
          <li>📋 Professional information editing</li>
          <li>🏆 Credential verification display</li>
          <li>📱 Practice contact details</li>
          <li>🔐 Privacy and security settings</li>
        </ul>
      </div>
      
      <div className="development-timeline">
        <div className="timeline-badge">
          📅 Expected Release: Q2 2025
        </div>
      </div>
      
      <div className="development-actions">
        <button 
          className="back-button"
          onClick={() => setActiveTab('dashboard')}
        >
          ← Back to Dashboard
        </button>
        
        <button className="notify-button">
          🔔 Notify Me When Ready
        </button>
      </div>
    </div>
  </div>
);

export default Profile;