import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './Appointments.css';
import '../../styles/Auth.css';
import '../../styles/Common.css';
import { useUser } from '../../context/UserContext';

// Common Header Component (matching your FindDoctor pattern)
const CommonHeader = ({ user, activeMenuItem, onMenuClick, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'appointments', label: 'Appointments' },
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

const PatientAppointments = () => {
  const { user } = useUser();
  
  // State management
  const [activeTab, setActiveTab] = useState('all');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  
  // Form states
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState(new Date());
  const [availableSlotsForReschedule, setAvailableSlotsForReschedule] = useState([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  
  // Tooltip state
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 10;

  // Load appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, [currentPage, activeTab]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const params = {
        page: currentPage,
        size: PAGE_SIZE,
        status: activeTab === 'all' ? '' : activeTab
      };

      const response = await axios.get('/api/appointments', {
        params,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setAppointments(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
    } catch (err) {
      setError('Failed to fetch appointments');
      console.error('Error fetching appointments:', err);
      // Mock data fallback for development
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development/demo
  const setMockData = () => {
    setAppointments([
      {
        id: 'APT001',
        doctor: {
          name: 'Dr. Sarah Johnson',
          specialty: 'Cardiology',
          image: '/api/placeholder/48/48',
          rating: 4.8,
          experience: '12 years',
          hospital: 'Apollo Hospital'
        },
        date: '2024-06-15',
        time: '10:30 AM',
        type: 'video',
        status: 'confirmed',
        fee: 500,
        paymentStatus: 'paid',
        location: 'Apollo Hospital, Mumbai',
        appointmentType: 'consultation',
        symptoms: 'Chest pain, shortness of breath',
        prescription: 'Available',
        notes: 'Follow-up required in 2 weeks',
        patientName: 'John Doe',
        patientPhone: '+91 9876543210'
      },
      {
        id: 'APT002',
        doctor: {
          name: 'Dr. Rajesh Kumar',
          specialty: 'Orthopedics',
          image: '/api/placeholder/48/48',
          rating: 4.6,
          experience: '15 years',
          hospital: 'Max Hospital'
        },
        date: '2024-06-12',
        time: '2:00 PM',
        type: 'clinic',
        status: 'completed',
        fee: 800,
        paymentStatus: 'paid',
        location: 'Max Hospital, Delhi',
        appointmentType: 'check-up',
        symptoms: 'Back pain',
        prescription: 'Available',
        notes: 'X-ray reports reviewed',
        patientName: 'John Doe',
        patientPhone: '+91 9876543210'
      },
      {
        id: 'APT003',
        doctor: {
          name: 'Dr. Priya Sharma',
          specialty: 'Dermatology',
          image: '/api/placeholder/48/48',
          rating: 4.9,
          experience: '8 years',
          hospital: 'Fortis Hospital'
        },
        date: '2024-06-20',
        time: '11:00 AM',
        type: 'clinic',
        status: 'pending',
        fee: 600,
        paymentStatus: 'pending',
        location: 'Fortis Hospital, Bangalore',
        appointmentType: 'consultation',
        symptoms: 'Skin rash, itching',
        prescription: 'Pending',
        notes: 'Bring previous medical reports',
        patientName: 'John Doe',
        patientPhone: '+91 9876543210'
      }
    ]);
  };

  // Helper functions
  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'confirmed',
      pending: 'pending',
      completed: 'completed',
      cancelled: 'cancelled',
      rescheduled: 'pending'
    };
    return colors[status] || 'pending';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      paid: 'paid',
      pending: 'payment-pending',
      failed: 'failed',
      refunded: 'completed'
    };
    return colors[status] || 'payment-pending';
  };

  const handleMouseEnter = (e, text) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      text,
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY - 35
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, text: '', x: 0, y: 0 });
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         apt.doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || apt.status === selectedStatus;
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'upcoming' && ['confirmed', 'pending'].includes(apt.status)) ||
                      (activeTab === 'completed' && apt.status === 'completed') ||
                      (activeTab === 'cancelled' && apt.status === 'cancelled');
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  // Action handlers
  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) {
      setError('Please provide a cancellation reason');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/appointments/${selectedAppointment.id}/cancel`, {
        reason: cancelReason
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === selectedAppointment.id 
            ? { ...apt, status: 'cancelled' }
            : apt
        )
      );
      
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedAppointment(null);
    } catch (err) {
      setError('Failed to cancel appointment');
      console.error('Error cancelling appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!selectedNewSlot) {
      setError('Please select a new time slot');
      return;
    }
    
    setRescheduleLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/appointments/${selectedAppointment.id}/reschedule`, {
        newSlotId: selectedNewSlot.id,
        newDateTime: selectedNewSlot.startTime
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === selectedAppointment.id 
            ? { 
                ...apt, 
                date: new Date(selectedNewSlot.startTime).toISOString().split('T')[0],
                time: new Date(selectedNewSlot.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                status: 'confirmed'
              }
            : apt
        )
      );
      
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      setSelectedNewSlot(null);
    } catch (err) {
      setError('Failed to reschedule appointment');
      console.error('Error rescheduling appointment:', err);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const fetchAvailableSlotsForReschedule = async (date) => {
    try {
      setRescheduleLoading(true);
      const token = localStorage.getItem('token');
      const formattedDate = date.toLocaleDateString('en-CA');
      
      const response = await axios.get('/api/doctors/slots/available', {
        params: { 
          doctorId: selectedAppointment.doctor.id,
          date: formattedDate
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Filter out past slots if date is today
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      let availableSlots = response.data.slots || [];
      
      if (selectedDate.getTime() === today.getTime()) {
        availableSlots = availableSlots.filter(slot => {
          const slotTime = new Date(slot.startTime);
          return slotTime > now;
        });
      }
      
      setAvailableSlotsForReschedule(availableSlots);
    } catch (err) {
      setError('Failed to fetch available slots');
      console.error('Error fetching available slots:', err);
      // Mock data for demo
      setAvailableSlotsForReschedule([
        { id: 'slot1', startTime: '2024-06-20T10:00:00', endTime: '2024-06-20T10:30:00' },
        { id: 'slot2', startTime: '2024-06-20T11:00:00', endTime: '2024-06-20T11:30:00' },
        { id: 'slot3', startTime: '2024-06-20T14:00:00', endTime: '2024-06-20T14:30:00' }
      ]);
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Update available slots when reschedule date changes
  useEffect(() => {
    if (showRescheduleModal && rescheduleDate && selectedAppointment) {
      fetchAvailableSlotsForReschedule(rescheduleDate);
    }
  }, [rescheduleDate, showRescheduleModal, selectedAppointment]);

  // Menu navigation (matching your FindDoctor pattern)
  const handleMenuClick = (menuId) => {
    switch (menuId) {
      case 'dashboard':
        window.location.href = '/patient/dashboard';
        break;
      case 'appointments':
        window.location.href = '/patient/appointments';
        break;
      case 'billing':
        window.location.href = '/patient/billing';
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  // Get stats data for header
  const getStatsData = () => {
    const total = appointments.length;
    const upcoming = appointments.filter(apt => ['confirmed', 'pending'].includes(apt.status)).length;
    const completed = appointments.filter(apt => apt.status === 'completed').length;
    const cancelled = appointments.filter(apt => apt.status === 'cancelled').length;

    return { total, upcoming, completed, cancelled };
  };

  const stats = getStatsData();

  const userInfo = {
    name: user?.name,
    role: user?.role
  };

  if (loading && appointments.length === 0) {
    return (
      <div>
        <CommonHeader 
          user={userInfo}
          activeMenuItem="appointments"
          onMenuClick={handleMenuClick}
          onLogout={handleLogout}
        />
        <div className="patient-appointments-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading appointments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Common Header */}
      <CommonHeader 
        user={userInfo}
        activeMenuItem="appointments"
        onMenuClick={handleMenuClick}
        onLogout={handleLogout}
      />

      <div className="patient-appointments-container">
      <div className="section-header">
      <div>
        <h2 className="section-title">My Appointments</h2>
        <p className="section-subtitle">Manage your healthcare appointments and consultations</p>
      </div>
    </div>

    {/* Stats Dashboard - Add this after section-header */}
    <div className="admin-stats">
      <div className="admin-stat-card">
        <div className="stat-icon">📊</div>
        <div className="stat-content">
          <h3>Total Appointments</h3>
          <div className="stat-value">{stats.total}</div>
        </div>
      </div>
      <div className="admin-stat-card">
        <div className="stat-icon">⏰</div>
        <div className="stat-content">
          <h3>Upcoming</h3>
          <div className="stat-value">{stats.upcoming}</div>
        </div>
      </div>
      <div className="admin-stat-card">
        <div className="stat-icon">✅</div>
        <div className="stat-content">
          <h3>Completed</h3>
          <div className="stat-value">{stats.completed}</div>
        </div>
      </div>
      <div className="admin-stat-card">
        <div className="stat-icon">❌</div>
        <div className="stat-content">
          <h3>Cancelled</h3>
          <div className="stat-value">{stats.cancelled}</div>
        </div>
      </div>
    </div>

        {/* Search Section */}
        <div className="search-section">
          {/* Search Tabs */}
          <div className="search-tabs">
            {['all', 'upcoming', 'completed', 'cancelled'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`search-tab ${activeTab === tab ? 'active' : ''}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <div className="search-form">
            <div className="search-form-row">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Search doctors or specialties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="dropdown-select"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <button 
                className="auth-button"
                onClick={() => console.log('Book new appointment')}
              >
                Book New Appointment
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-container">
              <div className="error-message">{error}</div>
              <button 
                onClick={() => setError(null)}
                className="retry-btn"
              >
                ✕
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredAppointments.length === 0 && (
            <div className="empty-state">
              <div className="empty-title">No appointments found</div>
              <div className="empty-message">
                {searchTerm || selectedStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'You haven\'t booked any appointments yet'
                }
              </div>
              {!searchTerm && selectedStatus === 'all' && (
                <div className="empty-suggestion">
                  Ready to find your doctor?<br/>
                  • Search for qualified healthcare professionals<br/>
                  • Book appointments with verified doctors<br/>
                  • Get the care you deserve
                </div>
              )}
            </div>
          )}
        </div>

        {/* Appointments List */}
        {filteredAppointments.length > 0 && (
          <div className="doctors-list">
            {filteredAppointments.map(appointment => (
              <div key={appointment.id} className="doctor-info">
                <div className="doctor-info-header">
                  {/* Avatar */}
                  <div className="doctor-avatar">
                    <img 
                      src={appointment.doctor.image} 
                      alt={appointment.doctor.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div 
                      className="avatar-initials" 
                      style={{ display: appointment.doctor.image ? 'none' : 'flex' }}
                    >
                      {appointment.doctor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                  </div>
                  
                  {/* Doctor Details */}
                  <div className="doctor-details">
                    <h3 className="doctor-name">{appointment.doctor.name}</h3>
                    <p className="doctor-specialty">{appointment.doctor.specialty}</p>
                    <p className="doctor-experience">{appointment.doctor.experience} experience</p>
                    <p className="consultation-fee">₹{appointment.fee} Consultation fee</p>
                    
                    {/* Appointment Details */}
                    <div className="appointment-details">
                      <span>📅 {appointment.date} at {appointment.time}</span>
                      <span>{appointment.type === 'video' ? '💻 Video Consultation' : '📍 ' + appointment.location}</span>
                    </div>
                    
                    {/* Rating */}
                    <div className="doctor-rating">
                      <span className="rating-percentage">👍 {Math.round((appointment.doctor.rating || 4.5) * 20)}%</span>
                    </div>
                  </div>
                  
                  {/* Right Actions */}
                  <div className="doctor-actions-right">
                    <div className="appointment-status-badges">
                      <span className={`status-badge ${getStatusColor(appointment.status)}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                      <span className={`status-badge ${getPaymentStatusColor(appointment.paymentStatus)}`}>
                        {appointment.paymentStatus.charAt(0).toUpperCase() + appointment.paymentStatus.slice(1)}
                      </span>
                    </div>
                    
                    <div className="action-buttons">
                      <button 
                        className="dark-bg-btn"
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowDetailsModal(true);
                        }}
                      >
                        Quick View
                      </button>
                      
                      <button 
                        className="dark-bg-btn"
                        onClick={() => {
                          window.location.href = `/patient/appointment-details/${appointment.id}`;
                        }}
                      >
                        Full Details
                      </button>
                      
                      {/* Video Call Button */}
                      {appointment.status === 'confirmed' && appointment.type === 'video' && (
                        <button 
                          className="dark-bg-btn video"
                          onMouseEnter={(e) => handleMouseEnter(e, 'Join video call')}
                          onMouseLeave={handleMouseLeave}
                        >
                          Join Call
                        </button>
                      )}
                      
                      {/* Reschedule Button */}
                      {['confirmed', 'pending'].includes(appointment.status) && (
                        <button 
                          className="dark-bg-btn reschedule"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setRescheduleDate(new Date());
                            setShowRescheduleModal(true);
                          }}
                          onMouseEnter={(e) => handleMouseEnter(e, 'Reschedule appointment')}
                          onMouseLeave={handleMouseLeave}
                        >
                          Reschedule
                        </button>
                      )}
                      
                      {/* Cancel Button */}
                      {['confirmed', 'pending'].includes(appointment.status) && (
                        <button 
                          className="dark-bg-btn cancel"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowCancelModal(true);
                          }}
                          onMouseEnter={(e) => handleMouseEnter(e, 'Cancel appointment')}
                          onMouseLeave={handleMouseLeave}
                        >
                          Cancel
                        </button>
                      )}
                      
                      {/* Download Prescription */}
                      {appointment.prescription === 'Available' && (
                        <button 
                          className="dark-bg-btn prescription"
                          onMouseEnter={(e) => handleMouseEnter(e, 'Download prescription')}
                          onMouseLeave={handleMouseLeave}
                        >
                          Prescription
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="pagination-btn"
                >
                  Previous
                </button>
                
                <div className="pagination-info">
                  Page {currentPage + 1} of {totalPages}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        {showDetailsModal && selectedAppointment && (
          <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetailsModal(false);
            }
          }}>
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">Appointment Details</h2>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                {/* Doctor Info */}
                <div className="doctor-info-header">
                  <div className="doctor-avatar">
                    <img 
                      src={selectedAppointment.doctor.image} 
                      alt={selectedAppointment.doctor.name}
                    />
                  </div>
                  <div className="doctor-details">
                    <h3 className="doctor-name">{selectedAppointment.doctor.name}</h3>
                    <p className="doctor-specialty">{selectedAppointment.doctor.specialty}</p>
                    <p className="doctor-experience">{selectedAppointment.doctor.experience}</p>
                  </div>
                  <div className="appointment-status-badges">
                    <span className={`status-badge ${getStatusColor(selectedAppointment.status)}`}>
                      {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="form-group">
                  <label className="form-label">📅 Date & Time</label>
                  <p className="detail-text">{selectedAppointment.date} at {selectedAppointment.time}</p>
                </div>

                <div className="form-group">
                  <label className="form-label">{selectedAppointment.type === 'video' ? '💻 Type' : '📍 Location'}</label>
                  <p className="detail-text">
                    {selectedAppointment.type === 'video' ? 'Video Consultation' : selectedAppointment.location}
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">💰 Fee</label>
                  <p className="detail-text">₹{selectedAppointment.fee}</p>
                </div>

                <div className="form-group">
                  <label className="form-label">🩺 Symptoms/Reason</label>
                  <p className="detail-text">{selectedAppointment.symptoms}</p>
                </div>

                {selectedAppointment.notes && (
                  <div className="form-group">
                    <label className="form-label">📝 Doctor's Notes</label>
                    <p className="detail-text">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showCancelModal && (
          <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCancelModal(false);
            }
          }}>
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h2 className="modal-title">Cancel Appointment</h2>
                <button 
                  onClick={() => setShowCancelModal(false)}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Reason for cancellation</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Please provide a reason..."
                    className="form-input"
                    rows="4"
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  onClick={() => setShowCancelModal(false)}
                  className="retry-btn"
                  disabled={loading}
                >
                  Keep Appointment
                </button>
                <button 
                  onClick={handleCancelAppointment}
                  disabled={!cancelReason.trim() || loading}
                  className="auth-button"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  {loading ? 'Cancelling...' : 'Cancel Appointment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRescheduleModal && (
          <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRescheduleModal(false);
              setSelectedNewSlot(null);
            }
          }}>
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">Reschedule Appointment</h2>
                <button 
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setSelectedNewSlot(null);
                  }}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                {selectedAppointment && (
                  <div>
                    {/* Current Appointment */}
                    <div className="form-group">
                      <label className="form-label">📅 Current Appointment</label>
                      <p className="detail-text">{selectedAppointment.date} at {selectedAppointment.time} with {selectedAppointment.doctor.name}</p>
                    </div>

                    {/* Select New Date */}
                    <div className="form-group">
                      <label className="form-label">📆 Select New Date</label>
                      <DatePicker
                        selected={rescheduleDate}
                        onChange={date => {
                          setRescheduleDate(date);
                          setSelectedNewSlot(null);
                        }}
                        minDate={new Date()}
                        maxDate={new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0)}
                        dateFormat="MMMM d, yyyy"
                        className="form-input"
                        showPopperArrow={false}
                      />
                    </div>

                    {/* Available Slots */}
                    <div className="form-group">
                      <label className="form-label">⏰ Available Time Slots</label>
                      {rescheduleLoading ? (
                        <div className="loading-container">
                          <div className="loading-spinner"></div>
                          <span className="loading-text">Loading available slots...</span>
                        </div>
                      ) : availableSlotsForReschedule.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-title">No available slots</div>
                          <div className="empty-message">Please try a different date</div>
                        </div>
                      ) : (
                        <div className="time-slots-grid">
                          {availableSlotsForReschedule.map((slot, index) => (
                            <button
                              key={`reschedule-slot-${index}`}
                              onClick={() => setSelectedNewSlot(slot)}
                              className={`time-slot ${selectedNewSlot?.id === slot.id ? 'selected' : ''}`}
                            >
                              {new Date(slot.startTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button 
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setSelectedNewSlot(null);
                  }}
                  className="retry-btn"
                  disabled={rescheduleLoading}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRescheduleAppointment}
                  disabled={rescheduleLoading || !selectedNewSlot}
                  className="auth-button"
                >
                  {rescheduleLoading ? 'Rescheduling...' : 'Reschedule Appointment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tooltip */}
        {tooltip.show && (
          <div 
            className="tooltip"
            style={{
              position: 'absolute',
              left: tooltip.x,
              top: tooltip.y,
              zIndex: 10000
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientAppointments;