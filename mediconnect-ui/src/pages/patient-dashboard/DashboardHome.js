import React from 'react';
import './DashboardHome.css';

const DashboardHome = ({ stats, upcomingAppointments, formatDate }) => {
  return (
    <div className="dashboard-home">
      <h1>Welcome to Your Dashboard</h1>
      
      {/* Stats Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Upcoming Appointments</h3>
            <p className="stat-value">{stats.upcomingAppointments}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Pending Payments</h3>
            <p className="stat-value">${stats.pendingPayments}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Medical Records</h3>
            <p className="stat-value">{stats.medicalRecords}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💊</div>
          <div className="stat-content">
            <h3>Active Prescriptions</h3>
            <p className="stat-value">{stats.activePrescriptions}</p>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments Section */}
      <div className="appointments-section">
        <h2>Upcoming Appointments</h2>
        {upcomingAppointments && upcomingAppointments.length > 0 ? (
          <div className="appointments-list">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-header">
                  <h3>Dr. {appointment.doctorName}</h3>
                  <span className={`status ${appointment.status.toLowerCase()}`}>
                    {appointment.status}
                  </span>
                </div>
                <div className="appointment-details">
                  <p>
                    <strong>Date:</strong> {formatDate(appointment.date)}
                  </p>
                  <p>
                    <strong>Time:</strong> {appointment.time}
                  </p>
                  <p>
                    <strong>Type:</strong> {appointment.type}
                  </p>
                  {appointment.notes && (
                    <p>
                      <strong>Notes:</strong> {appointment.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-appointments">No upcoming appointments</p>
        )}
      </div>
    </div>
  );
};

export default DashboardHome; 