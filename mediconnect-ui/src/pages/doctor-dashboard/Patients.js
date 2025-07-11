import React from 'react';
import '../../styles/UnderDev.css';


const Patients = ({ setActiveTab }) => (
  <div className="under-development-container">
    <div className="under-development-content">
      <div className="development-icon">
        👥
      </div>
      
      <h2 className="development-title">
        Patient Management
      </h2>
      
      <h3 className="development-subtitle">
        Under Development
      </h3>
      
      <p className="development-description">
        We're developing a comprehensive patient management system to help you 
        maintain detailed patient records, track medical history, and provide 
        better healthcare services. This feature will be the heart of your 
        digital practice management.
      </p>
      
      <div className="development-features">
        <h4>Coming Soon:</h4>
        <ul>
          <li>👤 Complete patient profiles and demographics</li>
          <li>📋 Medical history and treatment records</li>
          <li>💊 Prescription and medication tracking</li>
          <li>🔬 Lab results and diagnostic reports</li>
          <li>📸 Medical images and document storage</li>
          <li>🚨 Health alerts and critical notifications</li>
          <li>📞 Patient contact and communication log</li>
          <li>💰 Insurance and billing information</li>
          <li>📊 Patient health analytics and trends</li>
          <li>🔒 HIPAA-compliant secure data management</li>
        </ul>
      </div>
      
      <div className="development-timeline">
        <div className="timeline-badge">
          📅 Expected Release: Q1 2026
        </div>
      </div>
      
      <div className="development-actions">
        <button 
          className="back-button"
          onClick={() => setActiveTab('dashboard')}
        >
          ← Back to Dashboard
        </button>
        
        <button 
          className="schedule-button"
          onClick={() => setActiveTab('schedule')}
        >
          📅 View Schedule Instead
        </button>
        
        <button className="notify-button">
          🔔 Notify Me When Ready
        </button>
      </div>
    </div>
  </div>
);

export default Patients;