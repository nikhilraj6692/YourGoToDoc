import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useChat } from '../../contexts/ChatContext';
import { handleLogoutWithWebSocketCleanup } from '../../utils/logout';
import './PatientDashboard.css';

// Common Header Component
const CommonHeader = ({ user, activeMenuItem, onMenuClick, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'records', label: 'Medical Records' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'billing', label: 'Billing' }
  ];

  return (
    <div className="common-header">
      <div className="header-container">
        <div className="header-logo">
          <span className="logo-icon">⚕️</span>
          <span className="logo-text">MediConnect</span>
        </div>
        
        <div className="header-menu">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`menu-item ${activeMenuItem === item.id ? 'active' : ''}`}
              onClick={() => onMenuClick(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="header-right">
          <div className="user-profile-mini">
            <div className="user-info">
              <span className="user-greeting">Hello, {user?.name?.split(' ')[0]}</span>
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

const PatientDashboard = ({ 
  patientInfo = {
    nextAppointment: "Tomorrow at 2:00 PM with Dr. Sarah Johnson"
  },
  stats = {
    upcomingAppointments: 3,
    pendingPayments: 150,
    medicalRecords: 12,
    activePrescriptions: 2
  },
  upcomingAppointments = [],
  prescriptions = [],
  healthMetrics = [],
  medicalHistory = [],
  paymentHistory = [],
  healthAlerts = [],
  formatDate = (date) => new Date(date).toLocaleDateString()
}) => {
  const { user } = useUser();
  const { disconnectFromAllChats } = useChat();
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const navigate = useNavigate();

  // Sample data for demonstration (remove when integrating with real API)
  const sampleAppointments = upcomingAppointments.length > 0 ? upcomingAppointments : [
    {
      id: 1,
      doctorName: "Dr. Sarah Johnson",
      specialization: "Cardiologist",
      date: "2025-06-02",
      time: "2:00 PM",
      type: "Follow-up",
      status: "scheduled",
      location: "Room 205"
    },
    {
      id: 2,
      doctorName: "Dr. Michael Chen",
      specialization: "General Medicine",
      date: "2025-06-05",
      time: "10:30 AM", 
      type: "Check-up",
      status: "scheduled",
      location: "Room 102"
    },
    {
      id: 3,
      doctorName: "Dr. Emily Davis",
      specialization: "Dermatology",
      date: "2025-05-28",
      time: "3:30 PM",
      type: "Consultation",
      status: "completed",
      location: "Room 301"
    }
  ];

  const samplePrescriptions = prescriptions.length > 0 ? prescriptions : [
    {
      id: 1,
      medication: "Lisinopril",
      dosage: "10mg once daily",
      prescribedBy: "Dr. Sarah Johnson",
      startDate: "2025-05-15",
      endDate: "2025-08-15",
      status: "active",
      refillsRemaining: 2
    },
    {
      id: 2,
      medication: "Metformin",
      dosage: "500mg twice daily",
      prescribedBy: "Dr. Michael Chen",
      startDate: "2025-04-20",
      endDate: "2025-07-20",
      status: "active",
      refillsRemaining: 1
    },
    {
      id: 3,
      medication: "Vitamin D3",
      dosage: "1000 IU daily",
      prescribedBy: "Dr. Emily Davis",
      startDate: "2025-03-10",
      endDate: "2025-06-10",
      status: "completed",
      refillsRemaining: 0
    }
  ];

  const sampleHealthMetrics = healthMetrics.length > 0 ? healthMetrics : [
    {
      id: 1,
      name: "Blood Pressure",
      value: "120/80",
      unit: "mmHg",
      status: "normal",
      icon: "❤️",
      lastUpdated: "2025-05-30"
    },
    {
      id: 2,
      name: "Heart Rate",
      value: "72",
      unit: "bpm",
      status: "normal",
      icon: "💓",
      lastUpdated: "2025-05-30"
    },
    {
      id: 3,
      name: "Blood Sugar",
      value: "95",
      unit: "mg/dL",
      status: "normal",
      icon: "🩸",
      lastUpdated: "2025-05-29"
    },
    {
      id: 4,
      name: "Weight",
      value: "165",
      unit: "lbs",
      status: "normal",
      icon: "⚖️",
      lastUpdated: "2025-05-28"
    }
  ];

  const sampleMedicalHistory = medicalHistory.length > 0 ? medicalHistory : [
    {
      id: 1,
      type: "Consultation",
      description: "Annual physical examination - All vitals normal",
      doctor: "Dr. Michael Chen",
      date: "2025-05-15",
      icon: "🩺"
    },
    {
      id: 2,
      type: "Lab Test",
      description: "Blood work - Cholesterol and glucose levels checked",
      doctor: "Dr. Sarah Johnson",
      date: "2025-05-10",
      icon: "🧪"
    },
    {
      id: 3,
      type: "Prescription",
      description: "Updated blood pressure medication dosage",
      doctor: "Dr. Sarah Johnson",
      date: "2025-05-05",
      icon: "💊"
    },
    {
      id: 4,
      type: "Imaging",
      description: "Chest X-ray - Results normal",
      doctor: "Dr. Emily Davis",
      date: "2025-04-28",
      icon: "📷"
    }
  ];

  const samplePaymentHistory = paymentHistory.length > 0 ? paymentHistory : [
    {
      id: 1,
      description: "Consultation - Dr. Michael Chen",
      amount: 120,
      date: "2025-05-15",
      status: "paid"
    },
    {
      id: 2,
      description: "Lab Tests - Blood Work",
      amount: 85,
      date: "2025-05-10",
      status: "paid"
    },
    {
      id: 3,
      description: "Upcoming Consultation - Dr. Sarah Johnson",
      amount: 150,
      date: "2025-06-02",
      status: "pending"
    },
    {
      id: 4,
      description: "X-ray Imaging",
      amount: 200,
      date: "2025-04-28",
      status: "paid"
    }
  ];

  const sampleHealthAlerts = healthAlerts.length > 0 ? healthAlerts : [
    {
      id: 1,
      type: "info",
      title: "Prescription Refill Reminder",
      message: "Your Lisinopril prescription has 2 refills remaining. Schedule your next appointment soon."
    }
  ];

  const handleMenuClick = (menuId) => {
    setActiveMenuItem(menuId);
    switch (menuId) {
      case 'dashboard':
        navigate('/patient/dashboard');
        break;
      case 'appointments':
        navigate('/patient/appointments');
        break;
      case 'records':
        // TODO: Implement medical records page
        break;
      case 'prescriptions':
        // TODO: Implement prescriptions page
        break;
      case 'billing':
        // TODO: Implement billing page
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    handleLogoutWithWebSocketCleanup(disconnectFromAllChats);
  };

  const handleFindDoctor = () => {
    navigate('/patient/find-doctor');
  };

  const handleBackToDashboard = () => {
    // Implement back to dashboard logic
  };

  const handleBookAppointment = () => {
    console.log('Book appointment clicked');
    alert('Booking appointment feature will be implemented');
  };

  const handleJoinCall = (appointmentId) => {
    console.log('Join call for appointment:', appointmentId);
    alert(`Joining video call for appointment ${appointmentId}`);
  };

  const handleReschedule = (appointmentId) => {
    console.log('Reschedule appointment:', appointmentId);
    alert(`Rescheduling appointment ${appointmentId}`);
  };

  const handleCancelAppointment = (appointmentId) => {
    console.log('Cancel appointment:', appointmentId);
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      alert(`Appointment ${appointmentId} cancelled`);
    }
  };

  const handleViewPrescription = (prescriptionId) => {
    console.log('View prescription:', prescriptionId);
    alert(`Viewing prescription details for ${prescriptionId}`);
  };

  const handleRequestRefill = (prescriptionId) => {
    console.log('Request refill for prescription:', prescriptionId);
    alert(`Refill requested for prescription ${prescriptionId}`);
  };

  const handleQuickAction = (action) => {
    console.log('Quick action:', action);
    switch (action) {
      case 'records':
        alert('Medical records feature will be implemented');
        break;
      case 'prescriptions':
        alert('Prescription management feature will be implemented');
        break;
      case 'billing':
        alert('Billing feature will be implemented');
        break;
      case 'health-tracker':
        alert('Health tracker feature will be implemented');
        break;
      case 'support':
        alert('Contacting support...');
        break;
      default:
        alert('Feature coming soon!');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return '📅';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '📅';
    }
  };

  const getNextAppointment = () => {
    const upcoming = sampleAppointments.filter(apt => apt.status === 'scheduled');
    if (upcoming.length > 0) {
      const next = upcoming[0];
      return `${formatDate(next.date)} at ${next.time} with ${next.doctorName}`;
    }
    return null;
  };

  // Get user info for header
  const userInfo = {
    name: user?.name,
    role: user?.role
  };

  return (
    <div>
      {/* Common Header */}
      <CommonHeader 
        user={userInfo}
        activeMenuItem={activeMenuItem}
        onMenuClick={handleMenuClick}
        onLogout={handleLogout}
      />

      <div className="pd-container">
        {/* Find Doctor Hero Section */}
        <div className="pd-find-doctor-hero">
          <div className="pd-hero-content">
            <div className="pd-hero-text">
              <h2>Find Your Perfect Doctor</h2>
              <p>Connect with qualified healthcare professionals in your area. Book appointments easily and get the care you need.</p>
              <button className="pd-find-doctor-btn" onClick={handleFindDoctor}>
                Find a Doctor
              </button>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="pd-welcome">
          <h2>Welcome back, {user?.name?.split(' ')[0]}!</h2>
          <p className="pd-subtitle">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          
          {(patientInfo.nextAppointment || getNextAppointment()) && (
            <div className="pd-next-appointment">
              <h4>Next Appointment</h4>
              <p>{patientInfo.nextAppointment || getNextAppointment()}</p>
            </div>
          )}
        </div>

        {/* Health Alerts */}
        {sampleHealthAlerts.length > 0 && sampleHealthAlerts.map(alert => (
          <div key={alert.id} className={`pd-health-alert ${alert.type}`}>
            <div className="pd-alert-icon">
              {alert.type === 'warning' ? '⚠️' : alert.type === 'error' ? '🚨' : 'ℹ️'}
            </div>
            <div className="pd-alert-content">
              <h4>{alert.title}</h4>
              <p>{alert.message}</p>
            </div>
          </div>
        ))}

        {/* Stats Cards */}
        <div className="pd-stats">
          <div className="pd-stat">
            <div className="pd-stat-icon">📅</div>
            <div className="pd-stat-content">
              <h3>Upcoming Appointments</h3>
              <div className="pd-stat-value">{stats.upcomingAppointments}</div>
            </div>
          </div>

          <div className="pd-stat">
            <div className="pd-stat-icon">💰</div>
            <div className="pd-stat-content">
              <h3>Pending Payments</h3>
              <div className="pd-stat-value">${stats.pendingPayments}</div>
            </div>
          </div>

          <div className="pd-stat">
            <div className="pd-stat-icon">📋</div>
            <div className="pd-stat-content">
              <h3>Medical Records</h3>
              <div className="pd-stat-value">{stats.medicalRecords}</div>
            </div>
          </div>

          <div className="pd-stat">
            <div className="pd-stat-icon">💊</div>
            <div className="pd-stat-content">
              <h3>Active Prescriptions</h3>
              <div className="pd-stat-value">{stats.activePrescriptions}</div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="pd-grid">
          {/* Appointments Section */}
          <div className="pd-appointments">
            <div className="pd-section-header">
              <h3>My Appointments</h3>
              <button className="pd-book-btn" onClick={handleBookAppointment}>
                Book Appointment
              </button>
            </div>

            <div className="pd-appointments-list">
              {sampleAppointments.length > 0 ? (
                sampleAppointments.map(appointment => (
                  <div key={appointment.id} className={`pd-appointment-card ${appointment.status}`}>
                    {/* Appointment Header */}
                    <div className="pd-appointment-header">
                      <div className="pd-doctor-info">
                        <div className="pd-doctor-avatar">
                          <span>{appointment.doctorName.split(' ')[1].charAt(0)}</span>
                        </div>
                        <div className="pd-doctor-name">
                          <h4>{appointment.doctorName}</h4>
                          <p className="pd-specialization">{appointment.specialization}</p>
                        </div>
                      </div>
                      
                      <span className={`pd-status-badge ${appointment.status}`}>
                        {getStatusIcon(appointment.status)} {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>

                    {/* Appointment Details */}
                    <div className="pd-appointment-details">
                      <div className="pd-detail-item">
                        <span className="pd-detail-icon">📅</span>
                        <span className="pd-detail-text">{formatDate(appointment.date)}</span>
                      </div>
                      <div className="pd-detail-item">
                        <span className="pd-detail-icon">🕐</span>
                        <span className="pd-detail-text">{appointment.time}</span>
                      </div>
                      <div className="pd-detail-item">
                        <span className="pd-detail-icon">🏥</span>
                        <span className="pd-detail-text">{appointment.location}</span>
                      </div>
                      <div className="pd-detail-item">
                        <span className="pd-detail-icon">📋</span>
                        <span className="pd-detail-text">{appointment.type}</span>
                      </div>
                    </div>

                    {/* Appointment Actions */}
                    {appointment.status === 'scheduled' && (
                      <div className="pd-appointment-actions">
                        <button 
                          className="pd-action-btn primary"
                          onClick={() => handleJoinCall(appointment.id)}
                        >
                          Join Video Call
                        </button>
                        <button 
                          className="pd-action-btn secondary"
                          onClick={() => handleReschedule(appointment.id)}
                        >
                          Reschedule
                        </button>
                        <button 
                          className="pd-action-btn danger"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="pd-empty-state">
                  <div className="pd-empty-icon">📅</div>
                  <h4>No Upcoming Appointments</h4>
                  <p>Book your next appointment to stay on top of your health!</p>
                  <button className="pd-book-btn" onClick={handleFindDoctor}>
                    Find a Doctor
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div>
            {/* Health Metrics */}
            <div className="pd-health-metrics">
              <div className="pd-section-header">
                <h3>Health Metrics</h3>
              </div>
              
              <div className="pd-metrics-grid">
                {sampleHealthMetrics.map(metric => (
                  <div key={metric.id} className="pd-metric-card">
                    <div className="pd-metric-header">
                      <span className="pd-metric-icon">{metric.icon}</span>
                      <h4 className="pd-metric-name">{metric.name}</h4>
                    </div>
                    <div className="pd-metric-value">
                      {metric.value} {metric.unit}
                    </div>
                    <div className={`pd-metric-status ${metric.status}`}>
                      {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pd-quick-actions">
              <div className="pd-section-header">
                <h3>Quick Actions</h3>
              </div>

              <div className="pd-actions-grid">
                <div className="pd-quick-action-card" onClick={handleFindDoctor}>
                  <div className="pd-action-icon">🔍</div>
                  <h4>Find a Doctor</h4>
                  <p>Search & book appointments</p>
                </div>

                <div className="pd-quick-action-card" onClick={() => handleQuickAction('records')}>
                  <div className="pd-action-icon">📋</div>
                  <h4>View Records</h4>
                  <p>Access medical history</p>
                </div>

                <div className="pd-quick-action-card" onClick={() => handleQuickAction('prescriptions')}>
                  <div className="pd-action-icon">💊</div>
                  <h4>Prescriptions</h4>
                  <p>Manage medications</p>
                </div>

                <div className="pd-quick-action-card" onClick={() => handleQuickAction('billing')}>
                  <div className="pd-action-icon">💳</div>
                  <h4>Billing</h4>
                  <p>View payments & invoices</p>
                </div>

                <div className="pd-quick-action-card" onClick={() => handleQuickAction('health-tracker')}>
                  <div className="pd-action-icon">🩺</div>
                  <h4>Health Tracker</h4>
                  <p>Log vital signs</p>
                </div>

                <div className="pd-quick-action-card" onClick={() => handleQuickAction('support')}>
                  <div className="pd-action-icon">📞</div>
                  <h4>Contact Support</h4>
                  <p>Get help when needed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prescriptions Section */}
        <div className="pd-prescriptions">
          <div className="pd-section-header">
            <h3>Active Prescriptions</h3>
            <button className="pd-book-btn" onClick={() => handleQuickAction('prescriptions')}>
              View All Prescriptions
            </button>
          </div>

          <div className="pd-prescriptions-list">
            {samplePrescriptions.filter(p => p.status === 'active').map(prescription => (
              <div key={prescription.id} className="pd-prescription-card">
                <div className="pd-prescription-header">
                  <div className="pd-medication-info">
                    <h4>{prescription.medication}</h4>
                    <p className="pd-dosage">{prescription.dosage}</p>
                  </div>
                  <span className={`pd-prescription-status ${prescription.status}`}>
                    {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                  </span>
                </div>
                
                <div className="pd-prescription-details">
                  <span>Prescribed by: {prescription.prescribedBy}</span>
                  <span>Refills remaining: {prescription.refillsRemaining}</span>
                  <span>Start: {formatDate(prescription.startDate)}</span>
                  <span>End: {formatDate(prescription.endDate)}</span>
                </div>
                
                <div className="pd-appointment-actions" style={{ marginTop: '1rem' }}>
                  <button 
                    className="pd-action-btn secondary"
                    onClick={() => handleViewPrescription(prescription.id)}
                  >
                    View Details
                  </button>
                  <button 
                    className="pd-action-btn primary"
                    onClick={() => handleRequestRefill(prescription.id)}
                    disabled={prescription.refillsRemaining === 0}
                  >
                    Request Refill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="pd-grid">
          {/* Medical History */}
          <div className="pd-medical-history">
            <div className="pd-section-header">
              <h3>Recent Medical History</h3>
              <button className="pd-book-btn" onClick={() => handleQuickAction('records')}>
                View Full History
              </button>
            </div>

            <div className="pd-history-list">
              {sampleMedicalHistory.slice(0, 4).map(item => (
                <div key={item.id} className="pd-history-item">
                  <div className="pd-history-icon">{item.icon}</div>
                  <div className="pd-history-content">
                    <h4>{item.type}</h4>
                    <p>{item.description}</p>
                    <span className="pd-history-date">
                      {formatDate(item.date)} • {item.doctor}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment History */}
          <div className="pd-payment-history">
            <div className="pd-section-header">
              <h3>Payment History</h3>
              <button className="pd-book-btn" onClick={() => handleQuickAction('billing')}>
                View All Payments
              </button>
            </div>

            <div className="pd-payment-list">
              {samplePaymentHistory.slice(0, 4).map(payment => (
                <div key={payment.id} className="pd-payment-item">
                  <div className="pd-payment-info">
                    <h4>{payment.description}</h4>
                    <p className="pd-payment-date">{formatDate(payment.date)}</p>
                  </div>
                  <div className="pd-payment-amount">
                    <span className="pd-amount">${payment.amount}</span>
                    <span className={`pd-payment-status ${payment.status}`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;