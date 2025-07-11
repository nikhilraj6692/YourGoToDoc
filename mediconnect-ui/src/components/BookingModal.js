import React, { useEffect, useState } from 'react';
import './BookingModal.css';
import '../styles/Common.css';
import { useToast } from '../context/ToastContext';

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
      const token = localStorage.getItem('token');
      fetch(`/api/appointments/doctor/${doctor.id}/month-slots`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
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
      return dayInfo.status.toLowerCase();
    }
    
    return dayInfo.hasAvailableSlot ? 'available' : 'no-slots';
  };

  const handleDateClick = (dateStr, dayNumber) => {
    const date = new Date(today.getFullYear(), today.getMonth(), dayNumber);
    if (date < new Date().setHours(0, 0, 0, 0)) return;
    
    const dayInfo = monthSlots[dateStr];
    if (!dayInfo || (!dayInfo.hasAvailableSlot && !dayInfo.hasAppointment)) return;
    
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setDateSlots([]);
    
    if (dayInfo.hasAppointment) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const token = localStorage.getItem('token');
    fetch(`/api/appointments/doctor/${doctor.id}/day-slots?date=${dateStr}`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
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
      const token = localStorage.getItem('token');
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel appointment');
      }

      showToast('Appointment cancelled successfully', 'success');
      // Refresh the month slots to update the UI
      const monthSlotsResponse = await fetch(`/api/appointments/doctor/${doctor.id}/month-slots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/appointments/${appointmentId}/payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      const monthSlotsResponse = await fetch(`/api/appointments/doctor/${doctor.id}/month-slots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Book Appointment</h2>
          <button 
                className="close-btn"
                onClick={() => onClose()}
              >
                ×
              </button>
        </div>

        {/* Doctor Info Card */}
        <div className="doctor-info-card">
          <div className={`doctor-avatar ${getAvatarTheme(doctor.fullName)}`}>
            {doctor.profilePhotoId ? (
              <img 
                src={`/api/documents/${doctor.profilePhotoId}`} 
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="avatar-initials" 
              style={{ display: doctor.profilePhotoId ? 'none' : 'flex' }}
            >
              {doctor.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          </div>
          <div className="doctor-details-small">

          <h2 className="doctor-name">Dr. {doctor.fullName}</h2>
            <p className="doctor-specialty">{doctor.specialization}</p>
            <p className="consultation-fee">₹{doctor.consultationFee} Consultation fee</p>
        </div>
        </div>

        {/* Calendar Section */}
        <div className="calendar-section">
          <div className="section-header">
            <h3>Select Date</h3>
            <span className="current-month">{currentMonth}</span>
          </div>
          
          {/* Calendar Legend */}
          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-dot available"></span>
              <span>Available</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot no-slots"></span>
              <span>No Slots</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot scheduled"></span>
              <span>Requested</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot confirmed"></span>
              <span>Confirmed</span>
            </div>
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
        </div>

        {/* Slots Section */}
        <div className="slots-section">
          <div className="section-header">
            <h3>{monthSlots[selectedDate]?.hasAppointment ? 'Appointment Details' : 'Available Slots'}</h3>
          </div>

          {!selectedDate && (
            <div className="no-date-selected">
              <span>📅</span>
              <p>Please select a date to view available time slots</p>
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
                if (dayInfo?.hasAppointment) {
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
                  
                  return (
                    <div className={`appointment-info ${isExpired ? 'expired' : 'upcoming'}`}>
                      <div className="appointment-status">
                        {isExpired ? 'Expired Appointment' : 'Upcoming Appointment'}
                      </div>
                      <div className="appointment-time">
                        {startTime} - {endTime}
                      </div>
                      <a href="#" className="view-details-link" onClick={(e) => {
                        e.preventDefault();
                        // Debug: Log the appointment ID
                        console.log('Appointment ID from month-slots:', dayInfo.appointmentId);
                        console.log('Full dayInfo:', dayInfo);
                        // Navigate to patient appointment details
                        window.location.href = `/patient/appointment-details/${dayInfo.appointmentId}`;
                      }}>
                        View Details
                      </a>
                    </div>
                  );
                }
                
                if (dateSlots.length === 0) {
                  return (
                    <div className="no-slots-available">
                      <span>✖️</span>
                      <p>No available slots for this date</p>
                      <small>Please try selecting another date</small>
                    </div>
                  );
                }

                return (
                  <div className="slots-grid">
                    {dateSlots.map(slot => (
                      <button
                        key={slot.id}
                        className={`slot-btn ${selectedSlot?.id === slot.id ? 'selected' : ''} ${slot.isBooked ? 'booked' : ''}`}
                        onClick={() => !slot.isBooked && setSelectedSlot(slot)}
                        disabled={slot.isBooked}
                      >
                        <span className="slot-time">
                          {formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)}
                        </span>
                        {slot.isBooked && <span className="booked-indicator">Booked</span>}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-actions" style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          background: 'white'
        }}>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          {(() => {
            const dayInfo = monthSlots[selectedDate];
            if (dayInfo?.hasAppointment) {
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
            return (
              <button 
                className="auth-button" 
                disabled={!selectedDate || !selectedSlot || loading} 
                onClick={handleBook}
              >
                {loading ? 'Requesting...' : 'Request Appointment'}
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;