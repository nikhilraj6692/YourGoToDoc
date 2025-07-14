import React, { useState } from 'react';
import DatePicker from './DatePicker';
import './RemoveSlotModal.css';
import TimePicker from './TimePicker';

const RemoveSlotModal = ({ 
  isOpen, 
  onClose, 
  onDelete, 
  loading = false,
  mode = 'bulk', // 'bulk' or 'single'
  selectedSlot = null 
}) => {
  const [deleteStartDate, setDeleteStartDate] = useState(new Date());
  const [deleteEndDate, setDeleteEndDate] = useState(new Date());
  const [deleteStartTime, setDeleteStartTime] = useState('09:00');
  const [deleteEndTime, setDeleteEndTime] = useState('17:00');

  const handleDelete = () => {
    if (mode === 'bulk') {
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const deleteData = {
        startDate: formatDate(deleteStartDate),
        endDate: formatDate(deleteEndDate),
        startTime: deleteStartTime,
        endTime: deleteEndTime
      };
      
      onDelete(deleteData);
    } else {
      onDelete(selectedSlot);
    }
  };

  const getModalTitle = () => {
    if (mode === 'bulk') {
      return 'Delete Slots';
    } else if (selectedSlot?.available === false) {
      return 'Cancel Appointment';
    } else {
      return 'Delete Slot';
    }
  };

  const getWarningMessage = () => {
    if (mode === 'bulk') {
      return 'This action will delete all slots within the selected date and time range. This action cannot be undone.';
    } else if (selectedSlot?.available === false) {
      return 'This action will cancel the appointment and make the slot available again for booking. This action cannot be undone.';
    } else {
      return 'This action will delete the selected slot. This action cannot be undone.';
    }
  };

  const getDeleteButtonText = () => {
    if (loading) {
      if (mode === 'bulk') return 'Deleting...';
      if (selectedSlot?.available === false) return 'Canceling...';
      return 'Deleting...';
    }
    
    if (mode === 'bulk') return 'Delete All Slots';
    if (selectedSlot?.available === false) return 'Cancel Appointment';
    return 'Delete Slot';
  };

  const getCancelButtonText = () => {
    if (mode === 'bulk') return 'Cancel';
    if (selectedSlot?.available === false) return 'Back';
    return 'Cancel';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className="modal-content remove-slot-modal">
        <div className="modal-header">
          <h3 className="modal-title">{getModalTitle()}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          {mode === 'bulk' ? (
            <>
              <div className="form-group">
                <label>Start Date</label>
                <DatePicker
                  selected={deleteStartDate}
                  onChange={date => setDeleteStartDate(date)}
                  minDate={new Date()}
                  maxDate={new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)}
                  dateFormat="MMMM d, yyyy"
                  className="custom-datepicker"
                  showPopperArrow={false}
                  popperClassName="custom-datepicker-popper"
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <DatePicker
                  selected={deleteEndDate}
                  onChange={date => setDeleteEndDate(date)}
                  minDate={deleteStartDate}
                  maxDate={new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)}
                  dateFormat="MMMM d, yyyy"
                  className="custom-datepicker"
                  showPopperArrow={false}
                  popperClassName="custom-datepicker-popper"
                />
              </div>

              <div className="time-inputs">
                <div className="form-group">
                  <label>Start Time</label>
                  <TimePicker
                    value={deleteStartTime}
                    onChange={(time) => setDeleteStartTime(time)}
                    min="00:00"
                    max="23:59"
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <TimePicker
                    value={deleteEndTime}
                    onChange={(time) => setDeleteEndTime(time)}
                    min="00:00"
                    max="23:59"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Date</label>
                <div className="slot-info-display">
                  {new Date(selectedSlot.startTime).toLocaleDateString('default', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>

              <div className="time-inputs">
                <div className="form-group">
                  <label>Start Time</label>
                  <div className="slot-info-display">
                    {new Date(selectedSlot.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </div>
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <div className="slot-info-display">
                    {new Date(selectedSlot.endTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="warning-message">
            <p>{getWarningMessage()}</p>
          </div>
        </div>

        <div className="modal-actions modal-footer">
          <button 
            onClick={onClose}
            className="plain-btn hollow padding-large-hollow"
            disabled={loading}
          >
            {getCancelButtonText()}
          </button>
          <button 
            onClick={handleDelete}
            className="plain-btn remove padding-large"
            disabled={loading}
          >
            {getDeleteButtonText()}
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default RemoveSlotModal; 