import React, { useEffect, useState } from 'react';
import './BookingModal.css';
import '../styles/Common.css';
import { useToast } from '../context/ToastContext';
import tokenService from '../services/tokenService';

const getAvatarTheme = (fullName) => {
  const themes = ['theme-green', 'theme-purple', 'theme-pink', 'theme-orange', 'theme-teal', 'theme-indigo', 'theme-cyan'];
  let hash = 0;
  for (let i = 0; i < fullName.length; i++) {
    hash = ((hash << 5) - hash) + fullName.charCodeAt(i);
    hash = hash & hash;
  }
  return themes[Math.abs(hash) % themes.length];
};

const BookingModal = ({ open, onClose, doctor, onBook }) => {
  const { showToast } = useToast();
  const [monthSlots, setMonthSlots] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateSlots, setDateSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Reset state when modal is closed or doctor changes
  useEffect(() => {
    if (!open) {
      setMonthSlots({});
      setSelectedDate(null);
      setDateSlots([]);
      setSelectedSlot(null);
    }
  }, [open, doctor]);

  useEffect(() => {
    console.log('Modal useEffect triggered:', { open, doctorId: doctor?.id });
    if (open && doctor?.id) {
      console.log('Making API call for doctor:', doctor.id);
      setLoading(true);
      tokenService.authenticatedFetch(`/api/appointments/doctor/${doctor.id}/month-slots`)
        .then(res => res.json())
        .then(data => {
          console.log('Received month slots data:', data);
          setMonthSlots(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching month slots:', error);
          showToast('Error during operation. Please try after some time', 'error');
          setLoading(false);
        });
    }
  }, [open, doctor, showToast]);

  const today = new Date();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysInMonth = endOfMonth.getDate();
  const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDayStatus = (dateStr, dayNumber) => {
    const date = new Date(today.getFullYear(), today.getMonth(), dayNumber);
    if (date < today.setHours(0, 0, 0, 0)) return 'past';
    
    const dayInfo = monthSlots[dateStr];
    if (!dayInfo) return 'no-slots';

    if (dayInfo.hasAppointment) {
      // Check if appointment is expired (end time has passed)
      const now = new Date();
      const appointmentEnd = new Date(dayInfo.endTime);
      const isExpired = appointmentEnd < now;
      
      // If expired and not completed, return expired status
      if (isExpired && dayInfo.status !== 'COMPLETED') {
        return 'expired';
      }
      
      return dayInfo.status.toLowerCase();
    }
    
    return dayInfo.hasAvailableSlot ? 'available' : 'no-slots';
  };

  const handleDateClick = (dateStr, dayNumber) => {
    const date = new Date(today.getFullYear(), today.getMonth(), dayNumber);
    if (date < new Date().setHours(0, 0, 0, 0)) return;
    
    const dayInfo = monthSlots[dateStr];
    if (!dayInfo || (!dayInfo.hasAvailableSlot && !dayInfo.hasAppointment)) return;
    
    // Allow selecting dates with cancelled appointments, but don't show the cancelled appointment
    if (dayInfo.hasAppointment && dayInfo.status === 'CANCELLED') {
      // Set the date but don't show the cancelled appointment
      setSelectedDate(dateStr);
      setSelectedSlot(null);
      setDateSlots([]);
      
      // Fetch available slots for this date
      setLoading(true);
      tokenService.authenticatedFetch(`/api/appointments/doctor/${doctor.id}/day-slots?date=${dateStr}`)
        .then(res => res.json())
        .then(data => {
          setDateSlots(data);
          setLoading(false);
        })
        .catch(() => {
          showToast('Error during operation. Please try after some time', 'error');
          setLoading(false);
        });
      return;
    }
    
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setDateSlots([]);
    
    if (dayInfo.hasAppointment) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    tokenService.authenticatedFetch(`/api/appointments/doctor/${doctor.id}/day-slots?date=${dateStr}`)
      .then(res => res.json())
      .then(data => {
        setDateSlots(data);
        setLoading(false);
      })
      .catch(() => {
        showToast('Error during operation. Please try after some time', 'error');
        setLoading(false);
      });
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    
    setLoading(true);
    
    try {
      const response = await tokenService.authenticatedFetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: doctor.id,
          date: selectedDate,
          slotId: selectedSlot.id,
          calendarId: selectedSlot.calendarId,
          type: 'ONLINE',
          reason: 'Appointment requested through online booking'
        })
      });

      const data = await response.json();

      // Check if the response is an ErrorVO
      if (data.message) {
        showToast(data.message, 'error');
        return;
      }

      // If not an error, proceed with success
      onBook(selectedDate, selectedSlot, data);
    } catch (err) {
      console.error('Error booking appointment:', err);
      showToast('Error during operation. Please try after some time', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatSlotTime = (timeString) => {
    if (!timeString) return '';
    return timeString.slice(11, 16);
  };

  const formatSelectedDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    
    setLoading(true);
    try {
      const response = await tokenService.authenticatedFetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel appointment');
      }

      showToast('Appointment cancelled successfully', 'success');
      // Refresh the month slots to update the UI
      const monthSlotsResponse = await tokenService.authenticatedFetch(`/api/appointments/doctor/${doctor.id}/month-slots`);
      const updatedMonthSlots = await monthSlotsResponse.json();
      setMonthSlots(updatedMonthSlots);
    } catch (error) {
      showToast(error.message || 'Error cancelling appointment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePayAppointment = async (appointmentId) => {
    setLoading(true);
    try {
      const response = await tokenService.authenticatedFetch(`/api/appointments/${appointmentId}/payment`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initiate payment');
      }

      const paymentData = await response.json();
      // Here you would typically redirect to the payment gateway
      // For now, we'll just show a success message
      showToast('Payment initiated successfully', 'success');
      // Refresh the month slots to update the UI
      const monthSlotsResponse = await tokenService.authenticatedFetch(`/api/appointments/doctor/${doctor.id}/month-slots`);
      const updatedMonthSlots = await monthSlotsResponse.json();
      setMonthSlots(updatedMonthSlots);
    } catch (error) {
      showToast(error.message || 'Error initiating payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content booking-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Book Appointment</h2>
          <button 
                className="modal-close"
                onClick={() => onClose()}
              >
                ✕
              </button>
        </div>
        
        <div className="modal-body">

          {/* Calendar Section */}
          <div className="calendar-section">
            <div className="section-header">
              <span className="select-date-text">Please select a date</span>
              <span className="current-month">{currentMonth}</span>
            </div>
            
            

            {/* Calendar Grid */}
            <div className="calendar-grid">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-header">{day}</div>
              ))}
              
              {/* Calendar Days */}
              {[...Array(daysInMonth)].map((_, i) => {
                const dayNumber = i + 1;
                const date = new Date(today.getFullYear(), today.getMonth(), dayNumber);
                const dateStr = formatDate(date);
                const status = getDayStatus(dateStr, dayNumber);
                const isPast = date < new Date().setHours(0, 0, 0, 0);
                const dayInfo = monthSlots[dateStr];
                
                return (
                  <button
                    key={dateStr}
                    className={`calendar-day ${status} ${selectedDate === dateStr ? 'selected' : ''}`}
                    disabled={status === 'no-slots' || isPast}
                    onClick={() => handleDateClick(dateStr, dayNumber)}
                  >
                    <span className="day-number">{dayNumber}</span>
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-dot no-slots"></span>
                <span>No Slots</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot available"></span>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot scheduled"></span>
                <span>Requested</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot confirmed"></span>
                <span>Confirmed</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot completed"></span>
                <span>Completed</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot expired"></span>
                <span>Expired</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot cancelled"></span>
                <span>Cancelled</span>
              </div>
            </div>
          </div>

          {/* Slots Section */}
          <div className="slots-section">

            {!selectedDate && (
              <div className="no-date-selected">
                <span>📅</span>
                <p className="section-subtitle">Please select a date to view available time slots</p>
              </div>
            )}

            {selectedDate && loading && (
              <div className="loading-slots">
                <div className="loading-spinner-small"></div>
                <p>Loading available slots...</p>
              </div>
            )}

            {selectedDate && !loading && (
              <>
                {(() => {
                  const dayInfo = monthSlots[selectedDate];
                  
                  // Show available slots if they exist, regardless of cancelled appointments
                  if (dateSlots.length > 0) {
                    return (
                      <div className="slots-grid">
                        {dateSlots.map(slot => (
                          <button
                            key={slot.id}
                            className={`slot-btn ${selectedSlot?.id === slot.id ? 'selected' : ''} ${slot.isBooked ? 'booked' : ''} ${slot.status === 'CANCELLED' ? 'cancelled' : ''}`}
                            onClick={() => !slot.isBooked && slot.status !== 'CANCELLED' && setSelectedSlot(slot)}
                            disabled={slot.isBooked || slot.status === 'CANCELLED'}
                          >
                            <span className="slot-time">
                              {formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)}
                            </span>
                            {slot.isBooked && <span className="booked-indicator">Booked</span>}
                            {slot.status === 'CANCELLED'}
                          </button>
                        ))}
                      </div>
                    );
                  }
                  
                  // Show appointment info if there's an active appointment (not cancelled)
                  if (dayInfo?.hasAppointment && dayInfo?.status !== 'CANCELLED') {
                    const startTime = new Date(dayInfo.startTime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });
                    const endTime = new Date(dayInfo.endTime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });
                    
                    const now = new Date();
                    const appointmentEnd = new Date(dayInfo.endTime);
                    const isExpired = appointmentEnd < now;
                    
                    // Get status text based on appointment status and expiration
                    const getStatusText = () => {
                      if (isExpired && dayInfo.status !== 'COMPLETED') {
                        return 'Expired Appointment';
                      }
                      
                      switch (dayInfo.status) {
                        case 'SCHEDULED':
                          return 'Requested Appointment';
                        case 'CONFIRMED':
                          return 'Confirmed Appointment';
                        case 'CANCELLED':
                          return 'Cancelled Appointment';
                        case 'COMPLETED':
                          return 'Completed Appointment';
                        default:
                          return 'Upcoming Appointment';
                      }
                    };
                    
                    // Determine the CSS class based on status and expiration
                    const getAppointmentClass = () => {
                      if (isExpired && dayInfo.status !== 'COMPLETED') {
                        return 'expired';
                      }
                      return dayInfo.status.toLowerCase();
                    };
                    
                    return (
                      <div className={`appointment-info ${getAppointmentClass()}`}>
                        <div className="appointment-status">
                          {getStatusText()}
                        </div>
                        <div className="appointment-time">
                          {startTime} - {endTime}
                        </div>
                        {dayInfo.status !== 'CANCELLED' && !isExpired && (
                          <a href="#" className="view-details-link" onClick={(e) => {
                            e.preventDefault();
                            // Debug: Log the appointment ID
                            console.log('Appointment ID from month-slots:', dayInfo.appointmentId);
                            console.log('Full dayInfo:', dayInfo);
                            // Navigate to patient appointment details with return URL
                            const currentUrl = window.location.pathname + window.location.search;
                            const returnUrl = encodeURIComponent(currentUrl);
                            window.location.href = `/patient/appointment-details/${dayInfo.appointmentId}?returnUrl=${returnUrl}`;
                          }}>
                            View Details
                          </a>
                        )}
                      </div>
                    );
                  }
                  
                  // Show no slots message if no available slots and no active appointment
                  if (dateSlots.length === 0) {
                    return (
                      <div className="no-slots-available">
                        <span>✖️</span>
                        <p>No available slots for this date</p>
                        <small>Please try selecting another date</small>
                      </div>
                    );
                  }
                })()}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="modal-actions modal-footer" >
            <button className="plain-btn hollow" onClick={onClose}>
              Cancel
            </button>
            {(() => {
              const dayInfo = monthSlots[selectedDate];
              
              // Show booking button if there are available slots, regardless of cancelled appointments
              if (dateSlots.length > 0) {
                return (
                  <button 
                    className="plain-btn submit" 
                    disabled={!selectedDate || !selectedSlot || loading} 
                    onClick={handleBook}
                  >
                    {loading ? 'Requesting...' : 'Request Appointment'}
                  </button>
                );
              }
              
              // Show appointment action buttons if there's an active appointment (not cancelled)
              if (dayInfo?.hasAppointment && dayInfo?.status !== 'CANCELLED') {
                return (
                  <>
                    {dayInfo.status === 'SCHEDULED' && (
                      <button 
                        className="cancel-appointment-btn" 
                        onClick={() => handleCancelAppointment(dayInfo.appointmentId)}
                      >
                        Cancel Appointment
                      </button>
                    )}
                    {dayInfo.status === 'CONFIRMED' || dayInfo.status === 'SCHEDULED' && (
                      <>
                        {!dayInfo.isPaid && (
                          <button 
                            className="pay-appointment-btn" 
                            onClick={() => handlePayAppointment(dayInfo.appointmentId)}
                          >
                            Pay ₹{doctor.consultationFee}
                          </button>
                        )}
                      </>
                    )}
                  </>
                );
              }
              
              // Default case - no slots and no active appointment
              return null;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;