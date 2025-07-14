import React from 'react';
import '../../styles/Common.css';
import './Patients.css';

const Patients = ({ setActiveTab }) => (
  <div className="patients-section">
    <div className="section-header">
      <div>
        <h2 className="section-title">Patient Management</h2>
        <p className="section-subtitle">Comprehensive patient care and record management</p>
      </div>
    </div>
    <div className="empty-state">
      <div className="empty-state-icon">👥</div>
      <h3>Patient Management Coming Soon</h3>
      <p>Advanced patient management and healthcare record features will be available soon.</p>
    </div>
  </div>
);

export default Patients;