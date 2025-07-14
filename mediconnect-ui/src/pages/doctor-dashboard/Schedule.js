import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Schedule.css';
import '../../styles/Common.css';
import tokenService from '../../services/tokenService';
import { useToast } from '../../context/ToastContext';
import { useUser } from '../../context/UserContext';
import AddSlotsModal from '../../components/AddSlotsModal';
import RemoveSlotModal from '../../components/RemoveSlotModal';
import RescheduleSlotModal from '../../components/RescheduleSlotModal';
import axios from 'axios';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Schedule = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useUser();
  const [currentDate] = useState(new Date());
  const [bookedSlots, setBookedSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedStartTime, setSelectedStartTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [selectedEndTime, setSelectedEndTime] = useState('17:00');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatEndDate, setRepeatEndDate] = useState(() => {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    return sevenDaysLater > lastDayOfMonth ? lastDayOfMonth : sevenDaysLater;
  });
  const [repeatDays, setRepeatDays] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [currentPage, setCurrentPage] = useState(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const dayDiff = today.getDate() - firstDayOfMonth.getDate();
    return Math.floor(dayDiff / 3);
  });
  
  // New state variables for slot management
  const [slotDuration, setSlotDuration] = useState(15); // Default 15 minutes
  const [gapDuration, setGapDuration] = useState(5); // Default 5 minutes gap
  const [isExtendingSlot, setIsExtendingSlot] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [extendStart, setExtendStart] = useState(false);
  const [extendEnd, setExtendEnd] = useState(false);
  const [extensionMinutes, setExtensionMinutes] = useState(0);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [endTimeOptions, setEndTimeOptions] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningData, setWarningData] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSingleDeleteModal, setShowSingleDeleteModal] = useState(false);
  const [selectedSlotForDelete, setSelectedSlotForDelete] = useState(null);
  const [showCancelAppointmentModal, setShowCancelAppointmentModal] = useState(false);
  const [selectedSlotForCancel, setSelectedSlotForCancel] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedSlotForReschedule, setSelectedSlotForReschedule] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(new Date());
  const [availableSlotsForReschedule, setAvailableSlotsForReschedule] = useState([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  const weekDays = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  // Slot duration options (in minutes)
  const slotDurationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 20, label: '20 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' }
  ];

  useEffect(() => {
    fetchSchedules();
  }, [currentPage]);

  // Add new useEffect to handle automatic date selection
  useEffect(() => {
    const visibleDays = getVisibleDays();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if today's date is in the visible days
    const todayInVisibleDays = visibleDays.some(day => {
      const dayDate = new Date(day);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate.getTime() === today.getTime();
    });

    if (todayInVisibleDays) {
      setSelectedDate(today);
    } else {
      // If today is not visible, select the latest date
      const latestDate = visibleDays.reduce((latest, current) => {
        return current > latest ? current : latest;
      });
      setSelectedDate(latestDate);
    }
  }, [currentPage]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const visibleDays = getVisibleDays();
      
      // Filter to only include dates from the current month
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const currentMonthDates = visibleDays.filter(day => 
        day.getMonth() === currentMonth && day.getFullYear() === currentYear
      );
      
      // Only make API call if we have dates from current month
      if (currentMonthDates.length > 0) {
        const dates = currentMonthDates.map(day => day.toLocaleDateString('en-CA')).join(',');
        const response = await tokenService.authenticatedFetch(`/api/schedule/daily?dates=${dates}`);
        
        if (response.ok) {
          const data = await response.json();
          setSchedules(data);
          
          // Process the slots data for calendar display
          const slots = data.slots || data || [];
          const available = slots.filter(slot => slot.available !== false);
          const booked = slots.filter(slot => slot.available === false);
          
          setAvailableSlots(available);
          setBookedSlots(booked);
        } else {
          showToast('Failed to fetch schedule', 'error');
        }
      } else {
        // No current month dates, clear the slots
        setAvailableSlots([]);
        setBookedSlots([]);
        setSchedules([]);
      }
    } catch (err) {
      showToast('Error fetching schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeSlot = async (slotData) => {
    try {
      const response = await tokenService.authenticatedFetch('/api/schedule/slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slotData)
      });
      
      if (response.ok) {
        showToast('Time slot added successfully', 'success');
        fetchSchedules(); // Refresh the schedule
      } else {
        showToast('Failed to add time slot', 'error');
      }
    } catch (err) {
      showToast('Error adding time slot', 'error');
    }
  };

  const handleUpdateTimeSlot = async (slotId, slotData) => {
    try {
      const response = await tokenService.authenticatedFetch(`/api/schedule/slots/${slotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slotData)
      });
      
      if (response.ok) {
        showToast('Time slot updated successfully', 'success');
        fetchSchedules(); // Refresh the schedule
      } else {
        showToast('Failed to update time slot', 'error');
      }
    } catch (err) {
      showToast('Error updating time slot', 'error');
    }
  };

  const handleDeleteTimeSlot = async (slotId) => {
    try {
      const response = await tokenService.authenticatedFetch(`/api/schedule/slots/${slotId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showToast('Time slot deleted successfully', 'success');
        fetchSchedules(); // Refresh the schedule
      } else {
        showToast('Failed to delete time slot', 'error');
      }
    } catch (err) {
      showToast('Error deleting time slot', 'error');
    }
  };

  const handleSetAvailability = async (availabilityData) => {
    try {
      const response = await tokenService.authenticatedFetch('/api/schedule/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(availabilityData)
      });
      
      if (response.ok) {
        showToast('Availability updated successfully', 'success');
        fetchSchedules(); // Refresh the schedule
      } else {
        showToast('Failed to update availability', 'error');
      }
    } catch (err) {
      showToast('Error updating availability', 'error');
    }
  };

  const handleWarningConfirm = () => {
    setShowWarning(false);
    if (warningData) {
      handleAddSlots(warningData, true); // Pass warningData and skip day validation
    }
    setWarningData(null);
  };

  const handleWarningCancel = () => {
    setShowWarning(false);
    setWarningData(null);
  };

  const handleAddSlots = async (slotData, skipDayValidation = false) => {
    try {
      // Validate selected date if not skipping validation
      if (!skipDayValidation) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDateOnly = new Date(slotData.startDate);
        selectedDateOnly.setHours(0, 0, 0, 0);
        
        if (selectedDateOnly < today) {
          showToast('Cannot add slots for past dates', 'error');
          return;
        }
      }

      // Ensure recurringEndDate is set correctly
      if (slotData.isRecurring && !slotData.recurringEndDate) {
        slotData.recurringEndDate = slotData.startDate;
      }

      await handleAddTimeSlot(slotData);
      setShowSlotModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding slots:', error);
      showToast('Error adding slots', 'error');
    }
  };

  const handleDeleteSlot = async (slotId, calendarId) => {
    try {
      setLoading(true);
      const token = tokenService.getAccessToken();
      await axios.delete(`/api/schedule/calendar/${calendarId}/slots/${slotId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Close both modals and clear selected slots
      setShowSingleDeleteModal(false);
      setShowCancelAppointmentModal(false);
      setSelectedSlotForDelete(null);
      setSelectedSlotForCancel(null);
      
      showToast('Slot deleted successfully', 'success');
      // Refresh the schedule
      await fetchSchedules();
    } catch (err) {
      showToast('Failed to delete slot', 'error');
      console.error('Error deleting slot:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDate(new Date());
    const now = new Date();
    setSelectedStartTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    setSelectedEndTime('17:00');
    setIsRecurring(false);
    setRepeatDays([]);
    setRepeatEndDate(null);
    setSlotDuration(15);
    setGapDuration(5);
    setIsExtendingSlot(false);
    setSelectedSlot(null);
    setExtendStart(false);
    setExtendEnd(false);
    setExtensionMinutes(0);
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isSlotBooked = (day, hour) => {
    return bookedSlots.some(slot => {
      const slotDate = new Date(slot.startTime);
      return slotDate.getDate() === day && 
             slotDate.getMonth() === currentDate.getMonth() &&
             slotDate.getFullYear() === currentDate.getFullYear() &&
             slotDate.getHours() === hour;
    });
  };

  const isSlotAvailable = (day, hour) => {
    return availableSlots.some(slot => {
      return slot.day === day && 
             slot.month === currentDate.getMonth() &&
             slot.year === currentDate.getFullYear() &&
             hour >= slot.startHour && 
             hour < slot.endHour;
    });
  };

  const formatTimeRange = (startHour, endHour) => {
    const formatHour = (hour) => {
      return `${hour.toString().padStart(2, '0')}:00`;
    };
    
    return `${formatHour(startHour)} - ${formatHour(endHour)}`;
  };

  const getAvailableSlotsForDay = (day) => {
    return availableSlots.filter(slot => {
      const slotDate = new Date(slot.startTime);
      return slotDate.getDate() === day && 
             slotDate.getMonth() === currentDate.getMonth() &&
             slotDate.getFullYear() === currentDate.getFullYear();
    }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime)); // Sort by start time only
  };

  const getBookedSlotsForDay = (day) => {
    return bookedSlots.filter(slot => {
      const slotDate = new Date(slot.startTime);
      return slotDate.getDate() === day && 
             slotDate.getMonth() === currentDate.getMonth() &&
             slotDate.getFullYear() === currentDate.getFullYear();
    }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime)); // Sort by start time only
  };

  const isDateInCurrentMonth = (date) => {
    const today = new Date();
    return date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const isDateInPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateInFutureMonth = (date) => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return date >= nextMonth;
  };

  const getVisibleDays = () => {
    const days = [];
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Calculate the start date based on current page
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(1 + (currentPage * 4)); // Changed from 3 to 4
    
    // Add exactly 4 days starting from the calculated start date
    for (let i = 0; i < 4; i++) { // Changed from 3 to 4
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
      
      // Only add the day if it's within the current month
      if (day <= lastDayOfMonth) {
        days.push(day);
      }
    }
    
    // If we have less than 4 days (at the end of month), add days from next month
    while (days.length < 4) { // Changed from 3 to 4
      const lastDay = days[days.length - 1];
      const nextDay = new Date(lastDay);
      nextDay.setDate(nextDay.getDate() + 1);
      days.push(nextDay);
    }
    
    return days;
  };

  const handlePrevPage = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentStartDate = new Date(firstDayOfMonth);
    currentStartDate.setDate(currentStartDate.getDate() + (currentPage * 3));
    
    if (currentStartDate > firstDayOfMonth) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const currentEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    currentEndDate.setDate(currentEndDate.getDate() + (currentPage * 4) + 3); // Changed from +2 to +3 because we show 4 days
    
    if (currentEndDate < lastDayOfMonth) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleMouseEnter = (e, text) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      text,
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY - 30
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, text: '', x: 0, y: 0 });
  };

  const renderCalendar = () => {
    const visibleDays = getVisibleDays();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const currentStartDate = visibleDays[0];
    const currentEndDate = visibleDays[2];

    const canGoPrev = currentStartDate > firstDayOfMonth;
    const canGoNext = currentEndDate < lastDayOfMonth;

    return (
      <div className="calendar-container">
        <div className="calendar-navigation">
          <button 
            onClick={handlePrevPage}
            disabled={!canGoPrev}
            className="plain-btn nav-btn prev-btn"
          >
            Previous
          </button>
          
          <button 
            onClick={handleNextPage}
            disabled={!canGoNext}
            className="plain-btn nav-btn next-btn"
          >
            Next
          </button>
        </div>

        <div className="calendar-grid" >
          {visibleDays.map((day, index) => (
            <div key={`header-${index}`} className="calendar-header-cell">
              {day.toLocaleDateString('default', { weekday: 'long' })}
            </div>
          ))}
          
          {visibleDays.map((day, index) => {
            const isToday = today.getDate() === day.getDate() && 
                          today.getMonth() === day.getMonth() &&
                          today.getFullYear() === day.getFullYear();
            const isPast = day < today;
            const isNextMonth = day.getMonth() !== currentDate.getMonth();
            const isSelected = selectedDate && 
                             selectedDate.getDate() === day.getDate() &&
                             selectedDate.getMonth() === day.getMonth() &&
                             selectedDate.getFullYear() === day.getFullYear();

            const availableSlotsForDay = getAvailableSlotsForDay(day.getDate());
            const bookedSlotsForDay = getBookedSlotsForDay(day.getDate());

            // Combine and sort slots by start time
            const allSlots = [...availableSlotsForDay.map(slot => ({ ...slot, isAvailable: true })), 
                             ...bookedSlotsForDay.map(slot => ({ ...slot, isAvailable: false }))]
              .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

            return (
              <div 
                key={index} 
                className={`calendar-cell ${isToday ? 'today' : ''} ${isPast ? 'past' : ''} ${isNextMonth ? 'next-month' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedDate(day)}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? (isPast ? '1px solid #86bf23' : '2px solid #86bf23') : `1px solid ${isPast ? '#f1f5f9' : '#e2e8f0'}`,
                  backgroundColor: isSelected ? '#f8fafc' : 'white'
                }}
              >
                <div className="day-header">
                  {day.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                  {isToday && <span style={{fontSize: '0.8rem', opacity: 0.7}}>Today</span>}
                </div>
                
                <div className="time-slots">
                  {allSlots.map((slot, slotIndex) => {
                    const startTime = new Date(slot.startTime);
                    const endTime = new Date(slot.endTime);
                    const isAvailable = slot.isAvailable;

                    return (
                      <div 
                        key={`slot-${index}-${slotIndex}`} 
                        className={`time-slot ${isAvailable ? 'available' : 'booked'}`}
                        style={{
                          backgroundColor: isAvailable ? '#e6fffa' : '#fed7d7',
                          border: `1px solid ${isAvailable ? '#38b2ac' : '#f56565'}`,
                          color: isAvailable ? '#2c7a7b' : '#c53030',
                          position: 'relative',
                          padding: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          borderRadius: '0.2rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ 
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}>
                          {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})} - {endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                        </div>
                        
                        {isAvailable ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSlotForDelete(slot);
                              setShowSingleDeleteModal(true);
                            }}
                            onMouseEnter={(e) => handleMouseEnter(e, 'Delete slot')}
                            onMouseLeave={handleMouseLeave}
                            style={{
                              width: '16px',
                              height: '16px',
                              padding: 0,
                              background: 'transparent',
                              color: '#e53e3e',
                              border: 'none',
                              borderRadius: '50%',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.color = '#c53030';
                              e.currentTarget.style.transform = 'scale(1.1)';
                              e.currentTarget.style.backgroundColor = '#feb2b2';
                              e.currentTarget.style.borderRadius = '50%';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.color = '#e53e3e';
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.borderRadius = '50%';
                            }}
                          >
                            ✕
                          </button>
                        ) : (
                          <div style={{ 
                            display: 'flex', 
                            gap: '0.5rem'
                          }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSlotForCancel(slot);
                                setShowCancelAppointmentModal(true);
                              }}
                              onMouseEnter={(e) => handleMouseEnter(e, 'Delete slot')}
                              onMouseLeave={handleMouseLeave}
                              style={{
                                width: '20px',
                                height: '20px',
                                padding: 0,
                                background: 'transparent',
                                color: '#f56565',
                                border: 'none',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.color = '#e53e3e';
                                e.currentTarget.style.transform = 'scale(1.2)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.color = '#f56565';
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              ×
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/doctor/appointment-details/${slot.appointmentId}?returnUrl=/doctor/schedule`);
                              }}
                              onMouseEnter={(e) => handleMouseEnter(e, 'View Appointment Details')}
                              onMouseLeave={handleMouseLeave}
                              style={{
                                width: '20px',
                                height: '20px',
                                padding: 0,
                                background: 'transparent',
                                color: '#4299e1',
                                border: 'none',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.color = '#3182ce';
                                e.currentTarget.style.transform = 'scale(1.2)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.color = '#4299e1';
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              👁
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSlotForReschedule(slot);
                                setShowRescheduleModal(true);
                              }}
                              onMouseEnter={(e) => handleMouseEnter(e, 'Reschedule appointment')}
                              onMouseLeave={handleMouseLeave}
                              style={{
                                width: '20px',
                                height: '20px',
                                padding: 0,
                                background: 'transparent',
                                color: '#48bb78',
                                border: 'none',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.color = '#38a169';
                                e.currentTarget.style.transform = 'scale(1.2)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.color = '#48bb78';
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              📅
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {allSlots.length === 0 && (
                    <div className="time-slot" style={{
                      background: '#f1f5f9',
                      color: '#718096',
                      border: '1px dashed #cbd5e0',
                      fontSize: '0.7rem',
                      fontStyle: 'italic'
                    }}>
                      {isPast ? 'Past date' : isNextMonth ? 'Next month' : 'No slots'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {tooltip.show && (
          <div
            style={{
              position: 'absolute',
              left: tooltip.x,
              top: tooltip.y,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              zIndex: 1000,
              pointerEvents: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    );
  };

  const getStatsData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    if (!selectedDate) {
      // Calculate stats for all three dates
      const allAvailableSlots = [...availableSlots, ...bookedSlots].filter(slot => {
        const slotDate = new Date(slot.startTime);
        slotDate.setHours(0, 0, 0, 0);
        return (
          slotDate.getTime() === today.getTime() ||
          slotDate.getTime() === tomorrow.getTime() ||
          slotDate.getTime() === dayAfterTomorrow.getTime()
        );
      });

      const availableCount = allAvailableSlots.filter(slot => !slot.isBooked).length;
      const bookedCount = allAvailableSlots.filter(slot => slot.isBooked).length;

      return [
        {
          label: 'Available',
          value: availableCount,
          color: 'available'
        },
        {
          label: 'Booked',
          value: bookedCount,
          color: 'booked'
        }
      ];
    }

    // If a date is selected, show stats for that date only
    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);

    const availableCount = availableSlots.filter(slot => {
      const slotDate = new Date(slot.startTime);
      slotDate.setHours(0, 0, 0, 0);
      return slotDate.getTime() === selectedDateObj.getTime();
    }).length;

    const bookedCount = bookedSlots.filter(slot => {
      const slotDate = new Date(slot.startTime);
      slotDate.setHours(0, 0, 0, 0);
      return slotDate.getTime() === selectedDateObj.getTime();
    }).length;

    return [
      {
        label: 'Available',
        value: availableCount,
        color: 'available'
      },
      {
        label: 'Booked',
        value: bookedCount,
        color: 'booked'
      }
    ];
  };

  // Function to get available end times based on start time, duration, and gap
  const getAvailableEndTimes = (startTime, duration, gap) => {
    const slots = [];
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date('2000-01-01T23:59');
    
    let current = new Date(start);
    while (current < end) {
      const slotEnd = new Date(current);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);
      
      if (slotEnd <= end) {
        const endTimeStr = slotEnd.toTimeString().slice(0, 5);
        // Check if this time slot overlaps with any existing slots
        const schedulesArray = Array.isArray(schedules) ? schedules : [];
        const isAvailable = !schedulesArray.some(schedule => {
          const scheduleStart = new Date(schedule.startTime);
          const scheduleEnd = new Date(schedule.endTime);
          const slotStart = new Date(`2000-01-01T${startTime}`);
          const slotEnd = new Date(`2000-01-01T${endTimeStr}`);
          
          return (slotStart < scheduleEnd && slotEnd > scheduleStart);
        });

        if (isAvailable) {
          slots.push(endTimeStr);
        }
      }
      
      current.setMinutes(current.getMinutes() + duration + gap);
    }
    return slots;
  };

  // Update end time options when start time, duration, or gap changes
  useEffect(() => {
    if (selectedStartTime) {
      const availableEndTimes = getAvailableEndTimes(selectedStartTime, slotDuration, gapDuration);
      setEndTimeOptions(availableEndTimes.map(time => ({
        value: time,
        label: time
      })));
    }
  }, [selectedStartTime, slotDuration, gapDuration, schedules]);

  // Add this helper function at the top with other functions
  const formatGapDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
  };

  const handleDeleteSlots = async (deleteData) => {
    try {
      setLoading(true);

      const token = tokenService.getAccessToken();
      
      console.log('Sending delete request:', deleteData);

      const response = await axios.delete('/api/schedule/slots', {
        data: deleteData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Delete response:', response.data);
      
      setShowDeleteModal(false);
      showToast('Slots deleted successfully', 'success');
      await fetchSchedules();
    } catch (err) {
      console.error('Error deleting slots:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete slots';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (newSlot) => {
    try {
      setRescheduleLoading(true);
      const token = tokenService.getAccessToken();
      
      const response = await axios.post('/api/schedule/reschedule', {
        oldSlotId: selectedSlotForReschedule.id,
        oldCalendarId: selectedSlotForReschedule.calendarId,
        newSlotId: newSlot.id,
        newCalendarId: newSlot.calendarId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setShowRescheduleModal(false);
      setSelectedSlotForReschedule(null);
      showToast('Appointment rescheduled successfully', 'success');
      await fetchSchedules();
    } catch (err) {
      showToast('Failed to reschedule appointment', 'error');
      console.error('Error rescheduling:', err);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const fetchAvailableSlotsForReschedule = async (date) => {
    try {
      setRescheduleLoading(true);
      const token = tokenService.getAccessToken();
      const formattedDate = date.toLocaleDateString('en-CA');
      
      const response = await axios.get('/api/schedule/daily', {
        params: { 
          dates: formattedDate
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Filter out slots that are before current time if date is today
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      let availableSlots = (response.data.slots || []).filter(slot => slot.available === true);
      
      if (selectedDate.getTime() === today.getTime()) {
        availableSlots = availableSlots.filter(slot => {
          const slotTime = new Date(slot.startTime);
          return slotTime > now;
        });
      }
      
      setAvailableSlotsForReschedule(availableSlots);
    } catch (err) {
      showToast('Failed to fetch available slots', 'error');
      console.error('Error fetching available slots:', err);
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Add useEffect for fetching available slots when reschedule date changes
  useEffect(() => {
    if (showRescheduleModal && rescheduleDate) {
      fetchAvailableSlotsForReschedule(rescheduleDate);
    }
  }, [rescheduleDate, showRescheduleModal]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading schedules...</p>
      </div>
    );
  }

  const stats = getStatsData();
  
  return (
    <div>
      <div className="schedule-container-wrapper">
        {/* Page Header */}
        <div className="section-header">
          <div>
            <h2 className="section-title">Schedule Management</h2>
            <p className="section-subtitle">Manage your schedule so that patients can easily book appointments with you</p>
          </div>
        

          {/* The customStyles block is removed as styles are now handled by DatePicker.css */}
          
            <div className="header-actions">
              <div className="stats-display">
                <span>📊 {stats[0].value} Available</span>
                <span>📅 {stats[1].value} Booked</span>
              </div>
              
              <div className="header-buttons">
                <button 
                  className="plain-btn sec-submit-btn"
                  onClick={() => {
                    setIsExtendingSlot(false);
                    setShowSlotModal(true);
                  }}
                  style={{
                    padding: '0.8rem 1.35rem',
                  }}
                >
                  Add Slots
                </button>
                <button 
                  className="plain-btn remove"
                  style={{
                    padding: '0.8rem 0.8rem',
                  }}
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete Slots
                </button>
              </div>
          </div>
          </div>



          {renderCalendar()}

          <div className="schedule-legend">
            <div className="legend-item">
              <div className="legend-color not-available"></div>
              <span>No Slots Available</span>
            </div>
            <div className="legend-item">
              <div className="legend-color available"></div>
              <span>Available for Booking</span>
            </div>
            <div className="legend-item">
              <div className="legend-color booked"></div>
              <span>Booked Appointments</span>
            </div>
            <div className="legend-item">
              <div className="legend-color today"></div>
              <span>Today</span>
            </div>
          </div>
        
      </div>

      {/* Modals */}
      {showSlotModal && (
        <AddSlotsModal
          open={showSlotModal}
          onClose={() => {
            setShowSlotModal(false);
            resetForm();
          }}
          onAddSlots={handleAddSlots}
          isExtendingSlot={isExtendingSlot}
          selectedSlot={selectedSlot}
          extendStart={extendStart}
          extendEnd={extendEnd}
          extensionMinutes={extensionMinutes}
          onExtensionChange={(type, value) => {
            if (type === 'extendStart') setExtendStart(value);
            if (type === 'extendEnd') setExtendEnd(value);
            if (type === 'extensionMinutes') setExtensionMinutes(value);
          }}
        />
      )}

      {/* Bulk Delete Modal */}
      <RemoveSlotModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDeleteSlots}
        loading={loading}
        mode="bulk"
      />

      {/* Single Slot Delete Modal */}
      <RemoveSlotModal
        isOpen={showSingleDeleteModal}
        onClose={() => {
          setShowSingleDeleteModal(false);
          setSelectedSlotForDelete(null);
        }}
        onDelete={(slot) => handleDeleteSlot(slot.id, slot.calendarId)}
        loading={loading}
        mode="single"
        selectedSlot={selectedSlotForDelete}
      />

      {/* Cancel Appointment Modal */}
      <RemoveSlotModal
        isOpen={showCancelAppointmentModal}
        onClose={() => {
          setShowCancelAppointmentModal(false);
          setSelectedSlotForCancel(null);
        }}
        onDelete={(slot) => handleDeleteSlot(slot.id, slot.calendarId)}
        loading={loading}
        mode="single"
        selectedSlot={selectedSlotForCancel}
      />

      {/* Reschedule Appointment Modal */}
      <RescheduleSlotModal
        isOpen={showRescheduleModal}
        onClose={() => {
          setShowRescheduleModal(false);
          setSelectedSlotForReschedule(null);
        }}
        onReschedule={handleReschedule}
        onFetchAvailableSlots={fetchAvailableSlotsForReschedule}
        loading={rescheduleLoading}
        selectedSlot={selectedSlotForReschedule}
        availableSlots={availableSlotsForReschedule}
        rescheduleDate={rescheduleDate}
        onDateChange={setRescheduleDate}
      />
    </div>
  );
};

export default Schedule;