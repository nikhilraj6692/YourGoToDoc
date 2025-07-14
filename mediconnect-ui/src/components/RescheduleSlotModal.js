import React, { useState, useEffect } from 'react';
import DatePicker from './DatePicker';
import './RescheduleSlotModal.css';

const RescheduleSlotModal = ({ 
  isOpen, 
  onClose, 
  onReschedule, 
  onFetchAvailableSlots,
  loading = false,
  selectedSlot = null,
  availableSlots = [],
  rescheduleDate,
  onDateChange
}) => {
  const [selectedNewSlot, setSelectedNewSlot] = useState(null);

  // Reset selected slot when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedNewSlot(null);
    }
  }, [isOpen]);

  const handleReschedule = () => {
    if (selectedNewSlot) {
      onReschedule(selectedNewSlot);
    }
  };

  const handleDateChange = (date) => {
    setSelectedNewSlot(null); // Reset selection when date changes
    onDateChange(date);
  };

  const getCurrentAppointmentText = () => {
    if (!selectedSlot) return '';
    
    const date = new Date(selectedSlot.startTime);
    const dateStr = date.toLocaleDateString('default', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return `${dateStr} at ${timeStr}`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className="modal-content reschedule-slot-modal">
        <div className="modal-header">
          <h3 className="modal-title">Reschedule Appointment</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>Current Appointment</label>
            <div className="slot-info-display">
              {getCurrentAppointmentText()}
            </div>
          </div>

          <div className="form-group">
            <label>Select New Date</label>
            <div onClick={(e) => e.stopPropagation()}>
              <DatePicker
                selected={rescheduleDate}
                onChange={handleDateChange}
                minDate={new Date()}
                maxDate={new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)}
                dateFormat="MMMM d, yyyy"
                className="custom-datepicker"
                showPopperArrow={false}
                popperClassName="custom-datepicker-popper"
                popperPlacement="bottom"
                calendarClassName="custom-calendar"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Available Slots</label>
            {loading ? (
              <div className="loading-slots">
                Loading available slots...
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="no-slots-message">
                No available slots for the selected date
              </div>
            ) : (
              <div className="available-slots-grid">
                {availableSlots.map((slot, index) => (
                  <button
                    key={`reschedule-slot-${index}`}
                    onClick={() => setSelectedNewSlot(slot)}
                    className={`slot-button ${selectedNewSlot?.id === slot.id ? 'selected' : ''}`}
                  >
                    {new Date(slot.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions modal-footer">
        <button 
            onClick={onClose}
            className="plain-btn hollow padding-large-hollow"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            onClick={handleReschedule}
            className="plain-btn submit padding-large"
            disabled={loading || !selectedNewSlot}
          >
            {loading ? 'Rescheduling...' : 'Reschedule Appointment'}
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default RescheduleSlotModal; 