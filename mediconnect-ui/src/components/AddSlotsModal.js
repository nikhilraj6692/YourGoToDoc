import React, { useState, useEffect } from 'react';
import DatePicker from './DatePicker';
import './AddSlotsModal.css';
import '../styles/Common.css';
import TimePicker from './TimePicker';
import { useToast } from '../context/ToastContext';

const AddSlotsModal = ({ 
  open, 
  onClose, 
  onAddSlots, 
  isExtendingSlot = false,
  selectedSlot = null,
  extendStart = false,
  extendEnd = false,
  extensionMinutes = 0,
  onExtensionChange = null
}) => {
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [selectedEndTime, setSelectedEndTime] = useState('17:00');
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatEndDate, setRepeatEndDate] = useState(() => {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    return sevenDaysLater > lastDayOfMonth ? lastDayOfMonth : sevenDaysLater;
  });
  const [repeatDays, setRepeatDays] = useState([]);
  const [slotDuration, setSlotDuration] = useState(15);
  const [gapDuration, setGapDuration] = useState(5);
  const [endTimeOptions, setEndTimeOptions] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningData, setWarningData] = useState(null);
  const [startTimeError, setStartTimeError] = useState(false);

  const weekDays = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  const slotDurationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 20, label: '20 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' }
  ];

  useEffect(() => {
    if (open) {
      // Reset form when modal opens
      const now = new Date();
      setSelectedDate(new Date());
      setSelectedStartTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      setSelectedEndTime('17:00');
      setIsRecurring(false);
      setRepeatDays([]);
      setSlotDuration(15);
      setGapDuration(5);
      setStartTimeError(false);
    }
  }, [open]);

  useEffect(() => {
    if (selectedStartTime) {
      const options = getAvailableEndTimes(selectedStartTime, slotDuration, gapDuration);
      setEndTimeOptions(options);
      if (options.length > 0 && !selectedEndTime) {
        setSelectedEndTime(options[0].value);
      }
    }
  }, [selectedStartTime, slotDuration, gapDuration]);

  // Validate start time when date or start time changes
  useEffect(() => {
    if (selectedDate && selectedStartTime) {
      validateStartTime();
    }
  }, [selectedDate, selectedStartTime]);

  const getAvailableEndTimes = (startTime, duration, gap) => {
    if (!startTime) return [];
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const options = [];
    
    // Generate end times up to 23:59
    for (let i = 1; i <= 48; i++) { // 48 slots of 30 minutes each
      const endMinutes = startMinutes + (duration * i) + (gap * (i - 1));
      const endHour = Math.floor(endMinutes / 60);
      const endMinute = endMinutes % 60;
      
      if (endHour >= 24) break;
      
      const endTimeString = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      options.push({
        value: endTimeString,
        label: endTimeString
      });
    }
    
    return options;
  };

  const formatGapDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else if (minutes === 60) {
      return '1 hour';
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hours`;
      } else {
        return `${hours} hours ${remainingMinutes} minutes`;
      }
    }
  };

  const validateStartTime = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    // Only validate for today's date
    if (selectedDateOnly.getTime() === today.getTime()) {
      const [hours, minutes] = selectedStartTime.split(':').map(Number);
      const selectedTime = new Date();
      selectedTime.setHours(hours, minutes, 0, 0);
      
      // Get current time rounded down to the nearest minute
      const currentTime = new Date();
      currentTime.setSeconds(0, 0);
      
      if (selectedTime < currentTime) {
        setStartTimeError(true);
        return false;
      }
    }
    
    setStartTimeError(false);
    return true;
  };

  const handleSubmit = () => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Check if selected date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    if (selectedDateOnly < today) {
      showToast('Cannot add slots for past dates', 'error');
      return;
    }

    // Validate start time with visual feedback
    if (!validateStartTime()) {
      return;
    }

    // Check if recurring is selected and start date doesn't match selected repeat days
    if (isRecurring && repeatDays.length > 0) {
      const startDateDay = selectedDate.getDay();
      if (!repeatDays.includes(startDateDay)) {
        // Show warning modal
        const slotData = {
          startDate: selectedDate.toLocaleDateString('en-CA'),
          recurringEndDate: repeatEndDate.toLocaleDateString('en-CA'),
          startTime: selectedStartTime,
          endTime: selectedEndTime,
          slotDurationMinutes: slotDuration,
          gapDurationMinutes: gapDuration,
          recurringDays: repeatDays,
          isRecurring: isRecurring
        };
        setWarningData(slotData);
        setShowWarning(true);
        return;
      }
    }

    const slotData = {
      startDate: selectedDate.toLocaleDateString('en-CA'),
      recurringEndDate: isRecurring ? repeatEndDate.toLocaleDateString('en-CA') : selectedDate.toLocaleDateString('en-CA'),
      startTime: selectedStartTime,
      endTime: selectedEndTime,
      slotDurationMinutes: slotDuration,
      gapDurationMinutes: gapDuration,
      recurringDays: repeatDays,
      isRecurring: isRecurring
    };

    onAddSlots(slotData);
  };

  const handleWarningConfirm = () => {
    setShowWarning(false);
    if (warningData) {
      onAddSlots(warningData);
    }
    setWarningData(null);
  };

  const handleWarningCancel = () => {
    setShowWarning(false);
    setWarningData(null);
  };

  const handleClose = () => {
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" style={{ maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isExtendingSlot ? 'Extend Slot' : 'Add Slots'}
          </h3>
          <button className="modal-close" onClick={handleClose}>
          ✕
          </button>
        </div>
        
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {!isExtendingSlot && (
            <>
              <div className="form-group">
                <label>Date</label>
                <DatePicker
                  selected={selectedDate}
                  onChange={date => setSelectedDate(date)}
                  minDate={new Date()}
                  maxDate={new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)}
                  dateFormat="MMMM d, yyyy"
                  className="custom-datepicker"
                  showPopperArrow={false}
                  popperClassName="custom-datepicker-popper"
                />
              </div>
              
              <div className="form-group">
                <label>Slot Duration</label>
                <select 
                  value={slotDuration}
                  onChange={e => setSlotDuration(parseInt(e.target.value))}
                  className="form-select"
                >
                  {slotDurationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Gap Between Slots: {formatGapDuration(gapDuration)}</label>
                <div className="radius-slider-container">
                  <input
                    type="range"
                    min="5"
                    max="1440"
                    step="5"
                    value={gapDuration}
                    onChange={(e) => setGapDuration(parseInt(e.target.value))}
                    className="radius-slider"
                  />
                  <div className="radius-marks">
                    <span>5 min</span>
                    <span>24 hours</span>
                  </div>
                </div>
              </div>
              
              <div className="time-inputs form-group">
                <div>
                  <label>Start Time</label>
                  <TimePicker
                    value={selectedStartTime}
                    onChange={(time) => setSelectedStartTime(time)}
                    min={(() => {
                      const today = new Date();
                      const selectedDateTime = new Date(selectedDate);
                      selectedDateTime.setHours(0, 0, 0, 0);
                      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      
                      if (selectedDateTime.getTime() === todayDate.getTime()) {
                        // For today, set min time to current time (rounded up to next 15 minutes)
                        const now = new Date();
                        const minutes = now.getMinutes();
                        const roundedMinutes = Math.ceil(minutes / 15) * 15;
                        now.setMinutes(roundedMinutes, 0, 0);
                        
                        // If rounded time is in the next hour, adjust accordingly
                        if (roundedMinutes === 60) {
                          now.setHours(now.getHours() + 1);
                          now.setMinutes(0);
                        }
                        
                        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                      }
                      return "00:00";
                    })()}
                    max="23:59"
                    error={startTimeError}
                  />
                </div>
                <div>
                  <label>End Time</label>
                  <select 
                    value={selectedEndTime}
                    onChange={(e) => setSelectedEndTime(e.target.value)}
                    className="form-select"
                    disabled={!selectedStartTime}
                  >
                    <option value="">Select end time</option>
                    {endTimeOptions.map((option, index) => (
                      <option 
                        key={`end-${index}`} 
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="repeat-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                  <label>Make this a recurring schedule</label>
                </div>
                
                {isRecurring && (
                  <>
                    <div className="form-group">
                      <label>Repeat Until</label>
                      <DatePicker
                        selected={repeatEndDate}
                        onChange={date => setRepeatEndDate(date)}
                        minDate={selectedDate}
                        maxDate={new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0)}
                        dateFormat="MMMM d, yyyy"
                        className="custom-datepicker"
                        showPopperArrow={false}
                        popperClassName="custom-datepicker-popper"
                      />
                    </div>
                    
                    <div className="repeat-days-group form-group">
                      <label>Repeat on:</label>
                      <div className="repeat-days-checkboxes">
                        {weekDays.map(day => (
                          <div className="checkbox-group" key={day.value}>
                            <input
                              type="checkbox"
                              checked={repeatDays.includes(day.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRepeatDays([...repeatDays, day.value]);
                                } else {
                                  setRepeatDays(repeatDays.filter(d => d !== day.value));
                                }
                              }}
                            />
                            <label>{day.label}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <p className="recurring-disclaimer">
                Note: The time may conflict with existing scheduled time slots. The time slot will be adjusted accordingly respecting slot duration and gap between slots and booked slots.
              </p>
            </>
          )}

          {isExtendingSlot && selectedSlot && (
            <div className="extension-options">
              <label>
                <input
                  type="checkbox"
                  checked={extendStart}
                  onChange={(e) => onExtensionChange && onExtensionChange('extendStart', e.target.checked)}
                />
                <span>Extend start time</span>
              </label>
              
              <label>
                <input
                  type="checkbox"
                  checked={extendEnd}
                  onChange={(e) => onExtensionChange && onExtensionChange('extendEnd', e.target.checked)}
                />
                <span>Extend end time</span>
              </label>
              
              {(extendStart || extendEnd) && (
                <div className="form-group">
                  <label>Extension Minutes</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    step="5"
                    value={extensionMinutes}
                    onChange={(e) => onExtensionChange && onExtensionChange('extensionMinutes', parseInt(e.target.value))}
                    className="custom-input"
                    placeholder="Enter minutes to extend"
                  />
                </div>
              )}
            </div>
          )}
        </div>

    
        
        <div className="modal-actions modal-footer">
          <button className="plain-btn hollow padding-large-hollow" onClick={handleClose}>
            Cancel
          </button>
          <button 
            className="plain-btn submit" 
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedStartTime || !selectedEndTime}
          >
            {isExtendingSlot ? 'Extend Slot' : 'Add Slots'}
          </button>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <div className="modal-overlay" onClick={handleWarningCancel}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Warning</h3>
              <button className="modal-close" onClick={handleWarningCancel}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <p>
                The selected start date ({selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}) 
                does not match any of the selected repeat days. The recurring schedule will start from the next occurrence of the selected days.
              </p>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#718096' }}>
                Do you want to continue with this configuration?
              </p>
            </div>
            
            <div className="modal-actions modal-footer">
              <button className="plain-btn hollow" onClick={handleWarningCancel}>
                Cancel
              </button>
              <button className="plain-btn submit" onClick={handleWarningConfirm}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddSlotsModal; 