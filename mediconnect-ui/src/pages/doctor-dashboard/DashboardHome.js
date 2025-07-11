import React from 'react';
import './DashboardHome.css';

const DashboardHome = ({ stats, upcomingAppointments, formatDate }) => (
  <div className="dh-container">
    {/* Welcome Section */}
    <div className="dh-welcome">
      <h2>Welcome back, Doctor!</h2>
      <p className="dh-date">
        {new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </p>
    </div>

    {/* Stats Cards */}
    <div className="dh-stats">
      <div className="dh-stat">
        <div className="dh-stat-icon">📅</div>
        <div className="dh-stat-content">
          <h3>Today's Appointments</h3>
          <div className="dh-stat-value">{stats.appointmentsToday}</div>
        </div>
      </div>

      <div className="dh-stat">
        <div className="dh-stat-icon">👥</div>
        <div className="dh-stat-content">
          <h3>Total Patients</h3>
          <div className="dh-stat-value">{stats.totalPatients}</div>
        </div>
      </div>

      <div className="dh-stat">
        <div className="dh-stat-icon">🔔</div>
        <div className="dh-stat-content">
          <h3>Pending Requests</h3>
          <div className="dh-stat-value">{stats.pendingRequests}</div>
        </div>
      </div>

      <div className="dh-stat">
        <div className="dh-stat-icon">💰</div>
        <div className="dh-stat-content">
          <h3>This Month's Earnings</h3>
          <div className="dh-stat-value">{stats.earnings}</div>
        </div>
      </div>
    </div>

    {/* Main Content Grid */}
    <div className="dh-grid">
      {/* Appointments Section */}
      <div className="dh-appointments">
        <div className="dh-section-header">
          <h3>Upcoming Appointments</h3>
          <button className="dh-view-all">View All</button>
        </div>

        <div className="dh-appointments-list">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map(appointment => (
              <div key={appointment.id} className="dh-appointment-card">
                {/* Appointment Header */}
                <div className="dh-appointment-header">
                  <span className={`dh-status-badge ${appointment.status}`}>
                    {appointment.status === 'confirmed' ? '✓ Confirmed' : '⏱ Pending'}
                  </span>
                  <span className="dh-appointment-type">{appointment.type}</span>
                </div>

                {/* Appointment Details */}
                <div className="dh-appointment-details">
                  <div className="dh-patient-info">
                    <div className="dh-patient-avatar">
                      <span>{appointment.patientName.charAt(0)}</span>
                    </div>
                    <div className="dh-patient-name">
                      <h4>{appointment.patientName}</h4>
                      <p className="dh-complaint">{appointment.complaint}</p>
                    </div>
                  </div>

                  <div className="dh-appointment-time">
                    <div className="dh-date">{formatDate(appointment.date)}</div>
                    <div className="dh-time">{appointment.time}</div>
                  </div>
                </div>

                {/* Appointment Actions */}
                <div className="dh-appointment-actions">
                  <button className="dh-action-btn primary">
                    Start Session
                  </button>
                  <button className="dh-action-btn secondary">
                    Reschedule
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="dh-empty-state">
              <div className="dh-empty-icon">📅</div>
              <h4>No Upcoming Appointments</h4>
              <p>Your schedule is clear for today. Great time to catch up!</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="dh-quick-actions">
        <div className="dh-section-header">
          <h3>Quick Actions</h3>
        </div>

        <div className="dh-actions-grid">
          <div className="dh-quick-action-card">
            <div className="dh-action-icon">📅</div>
            <h4>Manage Schedule</h4>
            <p>Add or modify your availability</p>
            <button className="dh-action-link">Open Schedule</button>
          </div>

          <div className="dh-quick-action-card">
            <div className="dh-action-icon">👤</div>
            <h4>Patient Records</h4>
            <p>View and update patient information</p>
            <button className="dh-action-link">Coming Soon</button>
          </div>

          <div className="dh-quick-action-card">
            <div className="dh-action-icon">📊</div>
            <h4>Reports</h4>
            <p>Generate practice analytics</p>
            <button className="dh-action-link">Coming Soon</button>
          </div>

          <div className="dh-quick-action-card">
            <div className="dh-action-icon">⚙️</div>
            <h4>Settings</h4>
            <p>Manage your profile and preferences</p>
            <button className="dh-action-link">Coming Soon</button>
          </div>
        </div>
      </div>
    </div>

    {/* Recent Activity Section */}
    <div className="dh-recent-activity">
      <div className="dh-section-header">
        <h3>Recent Activity</h3>
        <button className="dh-view-all">View All</button>
      </div>

      <div className="dh-activity-list">
        <div className="dh-activity-item">
          <div className="dh-activity-icon">✅</div>
          <div className="dh-activity-content">
            <p>You completed an appointment with <strong>John Smith</strong></p>
            <span className="dh-activity-time">2 hours ago</span>
          </div>
        </div>

        <div className="dh-activity-item">
          <div className="dh-activity-icon">📅</div>
          <div className="dh-activity-content">
            <p>New appointment request from <strong>Sarah Johnson</strong></p>
            <span className="dh-activity-time">4 hours ago</span>
          </div>
        </div>

        <div className="dh-activity-item">
          <div className="dh-activity-icon">⏰</div>
          <div className="dh-activity-content">
            <p>Updated your schedule for next week</p>
            <span className="dh-activity-time">Yesterday</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardHome;