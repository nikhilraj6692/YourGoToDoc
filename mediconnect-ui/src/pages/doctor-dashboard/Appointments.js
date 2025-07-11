import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Appointments.css';
import '../../styles/Auth.css';
import '../../styles/Common.css';
import DoctorLayout from './DoctorLayout';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import AppointmentDetails from './AppointmentDetails';

const DoctorAppointments = () => {
  const { user } = useUser();
  const { showToast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState('today');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);
  
  // Form states
  const [cancelReason, setCancelReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  
  // Tooltip state
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 10;

  // Filtered appointments
  const [filteredAppointments, setFilteredAppointments] = useState([]);

  // Load appointments on component mount and when activeTab changes
  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  const fetchAppointments = async () => {
    setLoading(true);
    
    try {
      let url = '/api/appointments/doctor';
      const params = new URLSearchParams();
      
      // For 'today' tab, pass the date parameter
      if (activeTab === 'today') {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`; // YYYY-MM-DD format in local timezone
        params.append('date', todayStr);
      } else {
        // For other tabs, pass the status parameter
        params.append('status', activeTab.toUpperCase());
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const token = localStorage.getItem('token');
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      // Handle error silently - don't show error to user
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = (e, text) => {
    const rect = e.target.getBoundingClientRect();
    setTooltip({
      show: true,
      text,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, text: '', x: 0, y: 0 });
  };

  const getAvatarTheme = (fullName) => {
    const themes = ['theme-green', 'theme-purple', 'theme-pink', 'theme-orange', 'theme-teal', 'theme-indigo', 'theme-cyan'];
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = ((hash << 5) - hash) + fullName.charCodeAt(i);
      hash = hash & hash;
    }
    return themes[Math.abs(hash) % themes.length];
  };

  // Action handlers
  const handleConfirmAppointment = async (appointmentId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(`/api/appointments/${appointmentId}/confirm`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'CONFIRMED' }
            : apt
        )
      );
      
      showToast('Appointment confirmed successfully', 'success');
    } catch (err) {
      showToast('Failed to confirm appointment', 'error');
      console.error('Error confirming appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectAppointment = async () => {
    if (!rejectReason.trim()) {
      showToast('Please provide a reason for rejection', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(`/api/appointments/${selectedAppointment.id}/cancel`, 
        { reason: rejectReason },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === selectedAppointment.id 
            ? { ...apt, status: 'CANCELLED' }
            : apt
        )
      );
      
      showToast('Appointment rejected successfully', 'success');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedAppointment(null);
    } catch (err) {
      showToast('Failed to reject appointment', 'error');
      console.error('Error rejecting appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAppointment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(`/api/appointments/${selectedAppointment.id}/complete`, 
        { 
          notes: completionNotes,
          prescription: prescription
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === selectedAppointment.id 
            ? { 
                ...apt, 
                status: 'COMPLETED',
                notes: completionNotes,
                prescription: prescription || 'Available'
              }
            : apt
        )
      );
      
      showToast('Appointment completed successfully', 'success');
      setShowCompleteModal(false);
      setCompletionNotes('');
      setPrescription('');
      setSelectedAppointment(null);
    } catch (err) {
      showToast('Failed to complete appointment', 'error');
      console.error('Error completing appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) {
      showToast('Please provide a reason for cancellation', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(`/api/appointments/${selectedAppointment.id}/cancel`, 
        { reason: cancelReason },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === selectedAppointment.id 
            ? { ...apt, status: 'CANCELLED' }
            : apt
        )
      );
      
      showToast('Appointment cancelled successfully', 'success');
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedAppointment(null);
    } catch (err) {
      showToast('Failed to cancel appointment', 'error');
      console.error('Error cancelling appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get stats data for header
  const getStatsData = () => {
    const total = appointments.length;
    const scheduled = appointments.filter(a => a.status === 'SCHEDULED').length;
    const confirmed = appointments.filter(a => a.status === 'CONFIRMED').length;
    const completed = appointments.filter(a => a.status === 'COMPLETED').length;
    const cancelled = appointments.filter(a => a.status === 'CANCELLED').length;
    
    return { total, scheduled, confirmed, completed, cancelled };
  };

  // Check if appointment is overdue
  const isAppointmentOverdue = (appointment) => {
    const appointmentDateTime = new Date(appointment.date + ' ' + appointment.time);
    const now = new Date();
    return appointmentDateTime < now && (appointment.status === 'scheduled' || appointment.status === 'confirmed');
  };

  // Filter appointments based on search term and status filter
  useEffect(() => {
    let filtered = [...appointments];

    // Filter by status if not 'all' (only for non-today tabs since today uses date parameter)
    if (selectedStatus !== 'all' && activeTab !== 'today') {
      filtered = filtered.filter(appointment => appointment.status === selectedStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAppointments(filtered);
  }, [appointments, selectedStatus, searchTerm, activeTab]);

  // Scroll to top when detailed view is shown
  useEffect(() => {
    if (showDetailedView) {
      // Use setTimeout to ensure the component is rendered before scrolling
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [showDetailedView]);

  const stats = getStatsData();

  if (loading && appointments.length === 0) {
    return (
      <DoctorLayout activeTab="appointments">
        <div className="doctor-appointments-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading appointments...</p>
          </div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout activeTab="appointments">
      <>
        {/* Show detailed view if selected */}
        {showDetailedView && selectedAppointment ? (
          <AppointmentDetails 
            appointment={selectedAppointment} 
            onClose={() => {
              setShowDetailedView(false);
              setSelectedAppointment(null);
            }}
          />
        ) : (
          <div className="doctor-appointments-container">
            {/* Page Header */}
            <div className="section-header">
              <div>
                <h2 className="section-title">Doctor Appointments</h2>
                <p className="section-subtitle">Manage your patient appointments and consultations</p>
              </div>
              
              <div className="header-actions">
                <div className="stats-display">
                  <span>📊 Total: {stats.total}</span>
                  <span>⏳ Scheduled: {stats.scheduled}</span>
                  <span>✅ Confirmed: {stats.confirmed}</span>
                  <span>🏁 Completed: {stats.completed}</span>
                  <span>🚫 Cancelled: {stats.cancelled}</span>
                </div>
              </div>

            </div>


            
              {/* Search Tabs */}
              <div className="search-tabs">
                {['today', 'confirmed', 'scheduled', 'completed', 'cancelled'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`search-tab ${activeTab === tab ? 'active' : ''}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              

              {/* Empty State */}
              {!loading && filteredAppointments.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3>No appointments found</h3>
                  <p>
                    {searchTerm || selectedStatus !== 'all' 
                      ? 'Try adjusting your search or filters' 
                      : 'You don\'t have any appointments yet'
                    }
                  </p>
                </div>
              )}

            {/* Appointments List */}
            {filteredAppointments.length > 0 && (
              <div className="appointments-list">
                {filteredAppointments.map(appointment => {
                  // Helper function to check if appointment is overdue
                  const isAppointmentOverdue = (apt) => {
                    const now = new Date();
                    const appointmentDateTime = apt.startTime ? new Date(apt.startTime) : null;
                    return appointmentDateTime && appointmentDateTime < now && apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED';
                  };

                  return (
                    <div key={appointment.id} className="appointment-info">
                      {/* Overdue Banner */}
                      {isAppointmentOverdue(appointment) && (
                        <div className="overdue-banner">
                          ⚠️ This appointment is overdue
                        </div>
                      )}
                      
                      <div className="appointment-info-header">
                        {/* Patient Avatar */}
                        <div className={`patient-avatar ${getAvatarTheme(appointment.patientName)}`}>
                          <div 
                              className="avatar-initials" 
                              style={{ display: 'flex' }}
                            >
                              {appointment.patientName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          
                        </div>
                        
                        {/* Patient Details - Left Side */}
                        <div className="patient-details">
                          <h3 className="patient-name">{appointment.patientName}</h3>
                          <p className="appointment-reason">{appointment.reason || 'No reason provided'}</p>
                          <p className="appointment-time">
                             {appointment.startTime ? new Date(appointment.startTime).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            }) : 'N/A'} • {appointment.startTime ? new Date(appointment.startTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'} - {appointment.endTime ? new Date(appointment.endTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                          </p>
                          {appointment.notes && <p className="appointment-notes">📝 {appointment.notes}</p>}
                        </div>

                        {(appointment.paymentStatus !== 'PENDING' && appointment.paymentStatus !== 'pending') && (
                          <img 
                            src="/images/paid-in-full.png" 
                            alt="Paid in Full" 
                            className="paid-stamp"
                            style={{width: '90px', height: '90px'}}
                          />
                        )}
                        
                        {/* Actions - Right Side */}
                        <div className="appointment-actions-right">
                          <div className={`status-badge ${appointment.status.toLowerCase()}`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).toLowerCase()}
                          </div>
                          <p className="appointment-type">{appointment.type === 'ONLINE' ? '💻 Video Consultation' : '📍 In-Person Consultation'}</p>

                          
                          <div className="action-buttons">
                            <button 
                              className="plain-btn primary"
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowDetailedView(true);
                                // Scroll to top immediately
                                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                              }}
                            >
                              View Details
                            </button>
                            
                            {appointment.status === 'SCHEDULED' && (
                              <>
                                <button 
                                  className="plain-btn success"
                                  onClick={() => handleConfirmAppointment(appointment.id)}
                                  disabled={loading}
                                >
                                  Confirm
                                </button>
                                
                              </>
                            )}
                            
                            {['CONFIRMED', 'SCHEDULED'].includes(appointment.status) && (
                              <>
                                <button 
                                  className="plain-btn submit"
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setShowCompleteModal(true);
                                  }}
                                >
                                  Complete
                                </button>
                              </>
                            )}
                            
                            {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                              <button 
                                className="plain-btn danger"
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setShowCancelModal(true);
                                }}
                              >
                                Cancel
                              </button>
                            )}

                            
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        {showRejectModal && (
          <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRejectModal(false);
            }
          }}>
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h2 className="modal-title">Reject Appointment</h2>
                <button 
                  onClick={() => setShowRejectModal(false)}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Reason for rejection</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please provide a reason..."
                    className="form-input textarea"
                    rows="4"
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  onClick={() => setShowRejectModal(false)}
                  className="retry-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRejectAppointment}
                  disabled={!rejectReason.trim() || loading}
                  className="auth-button"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  {loading ? 'Rejecting...' : 'Reject Appointment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showCompleteModal && (
          <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCompleteModal(false);
            }
          }}>
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">Complete Appointment</h2>
                <button 
                  onClick={() => setShowCompleteModal(false)}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">📝 Consultation Notes</label>
                  <textarea
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="Enter consultation notes, diagnosis, recommendations..."
                    className="form-input textarea"
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">💊 Prescription (Optional)</label>
                  <textarea
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    placeholder="Enter prescription details..."
                    className="form-input textarea"
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  onClick={() => setShowCompleteModal(false)}
                  className="retry-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCompleteAppointment}
                  disabled={loading}
                  className="auth-button"
                  style={{ backgroundColor: '#10b981' }}
                >
                  {loading ? 'Completing...' : 'Complete Appointment'}
                </button>
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
                    className="form-input textarea"
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

        {/* Tooltip */}
        {tooltip.show && (
          <div 
            className="tooltip"
            style={{
              position: 'fixed',
              left: tooltip.x,
              top: tooltip.y,
              transform: 'translateX(-50%)',
              zIndex: 10000,
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              pointerEvents: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            {tooltip.text}
          </div>
        )}
      </>
    </DoctorLayout>
  );
};

export default DoctorAppointments;