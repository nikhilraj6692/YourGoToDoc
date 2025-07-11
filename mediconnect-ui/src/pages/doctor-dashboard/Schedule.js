import React, { useState, useEffect } from 'react';
import './Schedule.css';
import '../../styles/Common.css';
import DoctorLayout from './DoctorLayout';

import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const customStyles = `
  .custom-calendar {
    padding: 0 !important;
  }
  .custom-calendar .react-datepicker__month-container {
    padding: 0 !important;
  }
  .custom-calendar .react-datepicker__header {
    padding: 8px !important;
  }
  .custom-calendar .react-datepicker__month {
    margin: 0 !important;
    padding: 4px !important;
  }
  .custom-calendar .react-datepicker__day {
    margin: 0 !important;
    width: 2rem !important;
    line-height: 2rem !important;
  }
`;

const Schedule = () => {
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
  const [error, setError] = useState(null);
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
  const [deleteStartDate, setDeleteStartDate] = useState(new Date());
  const [deleteEndDate, setDeleteEndDate] = useState(new Date());
  const [deleteStartTime, setDeleteStartTime] = useState('09:00');
  const [deleteEndTime, setDeleteEndTime] = useState('17:00');
  const [showSingleDeleteModal, setShowSingleDeleteModal] = useState(false);
  const [selectedSlotForDelete, setSelectedSlotForDelete] = useState(null);
  const [showCancelAppointmentModal, setShowCancelAppointmentModal] = useState(false);
  const [selectedSlotForCancel, setSelectedSlotForCancel] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedSlotForReschedule, setSelectedSlotForReschedule] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(new Date());
  const [availableSlotsForReschedule, setAvailableSlotsForReschedule] = useState([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState(null);
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
      const token = localStorage.getItem('token');
      const visibleDays = getVisibleDays();

      const currentMonthDays = visibleDays.filter(day => 
        day.getMonth() === currentDate.getMonth()
      );
      
      // Format all dates and join them with commas
      const dates = currentMonthDays.map(day => 
        day.toLocaleDateString('en-CA') // 'en-CA' gives YYYY-MM-DD format
      ).join(',');
            
      const response = await axios.get('/api/schedule/daily', {
        params: { 
          dates: dates
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Process the response
      const available = [];
      const booked = [];
      
      const slots = response.data.slots || [];
      slots.forEach(slot => {
        const slotData = {
          id: slot.id,
          calendarId: slot.calendarId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          patientName: slot.patientName,
          isAvailable: slot.available
        };
        
        if (slot.available === true) {
          available.push(slotData);
        } else {
          booked.push(slotData);
        }
      });
      
      setAvailableSlots(available);
      setBookedSlots(booked);
      setError(null);
    } catch (err) {
      setError('Failed to fetch schedules');
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlots = async (skipDayValidation = false) => {
    try {
      setLoading(true);
      setError(null);

      // Validate slot duration
      const startTimeObj = new Date(`2000-01-01T${selectedStartTime}`);
      const endTimeObj = new Date(`2000-01-01T${selectedEndTime}`);
      const totalMinutes = (endTimeObj - startTimeObj) / (1000 * 60);
      
      if (slotDuration > totalMinutes) {
        setError(`Slot duration (${slotDuration} minutes) cannot be greater than the total time range (${totalMinutes} minutes). Please decrease the slot duration.`);
        return;
      }

      // Check if selected day matches recurring days
      if (!skipDayValidation && isRecurring && repeatDays.length > 0) {
        const selectedDayOfWeek = selectedDate.getDay();
        console.log('Selected day of week:', selectedDayOfWeek); // Debug log
        console.log('Repeat days:', repeatDays); // Debug log
        
        if (!repeatDays.includes(selectedDayOfWeek)) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const selectedDayName = dayNames[selectedDayOfWeek];
          const selectedRepeatDays = repeatDays.map(day => dayNames[day]).join(', ');
          
          console.log('Setting warning data:', { selectedDayName, selectedRepeatDays }); // Debug log
          setWarningData({
            selectedDayName,
            selectedRepeatDays
          });
          setShowWarning(true);
          setLoading(false);
          return;
        }
      }

      const token = localStorage.getItem('token');
      
      // Format dates to ensure they're in the correct timezone
      const formatDate = (date) => {
        return date.toLocaleDateString('en-CA');
      };

      const request = {
        startDate: formatDate(selectedDate),
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        isRecurring: isRecurring,
        recurringEndDate: isRecurring ? formatDate(repeatEndDate) : null,
        recurringDays: isRecurring ? repeatDays : null,
        slotDurationMinutes: slotDuration,
        gapDurationMinutes: gapDuration,
        extendExistingSlot: isExtendingSlot,
        existingSlotId: selectedSlot?.id,
        extendStartTime: extendStart,
        extendEndTime: extendEnd,
        extensionMinutes: extensionMinutes
      };

      console.log('Sending request:', request); // Debug log

      const response = await axios.post('/api/schedule/slots', request, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response:', response.data); // Debug log
      
      setShowSlotModal(false);
      await fetchSchedules();
      resetForm();
    } catch (err) {
      console.error('Error adding slots:', err);
      setError(err.response?.data?.message || 'Failed to add slots');
    } finally {
      setLoading(false);
    }
  };

  const handleWarningConfirm = () => {
    setShowWarning(false);
    handleAddSlots(true); // Pass true to skip day validation
  };

  const handleWarningCancel = () => {
    setShowWarning(false);
    setWarningData(null);
  };

  const handleDeleteSlot = async (slotId, calendarId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
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
      
      // Refresh the schedule
      await fetchSchedules();
    } catch (err) {
      setError('Failed to delete slot');
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
    startDate.setDate(1 + (currentPage * 3));
    
    // Add exactly 3 days starting from the calculated start date
    for (let i = 0; i < 3; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
      
      // Only add the day if it's within the current month
      if (day <= lastDayOfMonth) {
        days.push(day);
      }
    }
    
    // If we have less than 3 days (at the end of month), add days from next month
    while (days.length < 3) {
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
    currentEndDate.setDate(currentEndDate.getDate() + (currentPage * 3) + 2); // +2 because we show 3 days
    
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
            className="nav-btn prev-btn"
          >
            Previous
          </button>
          
          <button 
            onClick={handleNextPage}
            disabled={!canGoNext}
            className="nav-btn next-btn"
          >
            Next
          </button>
        </div>

        <div className="calendar-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          padding: '0 1rem'
        }}>
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
                          borderRadius: '8px',
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
                              width: '24px',
                              height: '24px',
                              padding: 0,
                              background: 'transparent',
                              color: '#e53e3e',
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
                              e.currentTarget.style.color = '#c53030';
                              e.currentTarget.style.transform = 'scale(1.2)';
                              e.currentTarget.style.backgroundColor = 'rgba(229, 62, 62, 0.1)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.color = '#e53e3e';
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            ×
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
                              onMouseEnter={(e) => handleMouseEnter(e, 'Cancel appointment')}
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
                                // TODO: Implement view details
                              }}
                              onMouseEnter={(e) => handleMouseEnter(e, 'View details')}
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
        const isAvailable = !schedules.some(schedule => {
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

  const handleDeleteSlots = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      
      // Format dates to ensure they're in the correct timezone
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const request = {
        startDate: formatDate(deleteStartDate),
        endDate: formatDate(deleteEndDate),
        startTime: deleteStartTime,
        endTime: deleteEndTime
      };

      console.log('Sending delete request:', request);

      const response = await axios.delete('/api/schedule/slots', {
        data: request,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Delete response:', response.data);
      
      setShowDeleteModal(false);
      await fetchSchedules();
    } catch (err) {
      console.error('Error deleting slots:', err);
      setError(err.response?.data?.message || 'Failed to delete slots');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    try {
      setRescheduleLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/schedule/reschedule', {
        oldSlotId: selectedSlotForReschedule.id,
        oldCalendarId: selectedSlotForReschedule.calendarId,
        newSlotId: selectedNewSlot.id,
        newCalendarId: selectedNewSlot.calendarId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setShowRescheduleModal(false);
      setSelectedSlotForReschedule(null);
      setSelectedNewSlot(null);
      await fetchSchedules();
    } catch (err) {
      setError('Failed to reschedule appointment');
      console.error('Error rescheduling:', err);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const fetchAvailableSlotsForReschedule = async (date) => {
    try {
      setRescheduleLoading(true);
      const token = localStorage.getItem('token');
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
      setError('Failed to fetch available slots');
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
    <DoctorLayout activeTab="schedule">
      <div className="schedule-container-wrapper">
        {/* Page Header */}
        <div className="section-header">
          <div>
            <h2 className="section-title">Schedule Management</h2>
            <p className="section-subtitle">Manage your schedule so patients can easily book appointments with you</p>
          </div>
        

          <style>{customStyles}</style>
          
            <div className="header-actions">
              <div className="stats-display">
                <span>📊 {stats[0].value} Available</span>
                <span>📅 {stats[1].value} Booked</span>
              </div>
              
              <div className="header-buttons">
                <button 
                  className="add-slots-btn"
                  onClick={() => {
                    setIsExtendingSlot(false);
                    setShowSlotModal(true);
                  }}
                >
                  Add Slots
                </button>
                <button 
                  className="delete-slots-btn"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete Slots
                </button>
              </div>
          </div>
          </div>

          {error && <div className="error-message">{error}</div>}

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
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowSlotModal(false);
          }
        }}>
          <div className="modal-content" style={{
            maxHeight: '90vh',
            width: '800px',
            position: 'relative',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {showWarning && (
              <div className="warning-modal" style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 3000,
                width: '80%',
                maxWidth: '600px',
                background: 'white',
                borderRadius: '0.8rem',
                padding: '1.5rem 2rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                <div className="warning-content">
                  <div className="warning-icon">⚠️</div>
                  <div className="warning-body">
                    <h4 className="warning-title">
                      Day Mismatch Warning
                    </h4>
                    <p className="warning-description">
                      You selected "{warningData?.selectedDayName}" but your recurring schedule is set for: <strong>{warningData?.selectedRepeatDays}</strong>.
                    </p>
                    <p className="warning-subtitle">
                      If you continue:
                    </p>
                    <ul className="warning-list">
                      <li>
                        Slots will be created based on your recurring days only
                      </li>
                      <li>
                        No slots will be added for "{warningData?.selectedDayName}" unless it's in your recurring selection
                      </li>
                    </ul>
                  
                    <div className="warning-actions">
                      <button
                        onClick={() => {
                          console.log('Proceed button clicked'); // Debug log
                          handleWarningConfirm();
                        }}
                        className="proceed-button"
                      >
                        Proceed with Recurring Schedule
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('Cancel button clicked'); // Debug log
                          handleWarningCancel();
                        }}
                        className="cancel-button"
                      >
                        Cancel & Modify
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <h3 style={{ 
              margin: 0,
              padding: '1.5rem 1.5rem 1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              {isExtendingSlot ? 'Extend Slot' : 'Add Slots'}
            </h3>
            
            <div style={{ 
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              maxHeight: 'calc(90vh - 180px)' // Account for header and footer
            }}>
              {!isExtendingSlot && (
                <>
                  <div className="input-group">
                    <label>📅 Date</label>
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
                  
                  <div className="input-group">
                    <label>Slot Duration</label>
                    <select 
                      value={slotDuration}
                      onChange={e => setSlotDuration(parseInt(e.target.value))}
                      className="custom-select"
                    >
                      {slotDurationOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group" style={{ marginTop: '1rem' }}>
                    <label>Gap Between Slots: {formatGapDuration(gapDuration)}</label>
                    <div style={{ position: 'relative', padding: '1rem 0.5rem' }}>
                      <input
                        type="range"
                        min="5"
                        max="1440"
                        step="5"
                        value={gapDuration}
                        onChange={(e) => setGapDuration(parseInt(e.target.value))}
                        className="custom-range"
                        style={{
                          width: '100%',
                          height: '6px',
                          borderRadius: '3px',
                          background: '#e2e8f0',
                          outline: 'none',
                          WebkitAppearance: 'none',
                          appearance: 'none',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        fontSize: '0.8rem',
                        color: '#718096',
                        marginTop: '0.75rem',
                        padding: '0 0.5rem'
                      }}>
                        <span>5 min</span>
                        <span>24 hours</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="time-inputs">
                    <div className="input-group">
                      <label>🕘 Start Time</label>
                      <input 
                        type="time" 
                        value={selectedStartTime}
                        onChange={(e) => setSelectedStartTime(e.target.value)}
                        className="custom-time-input"
                        min="00:00"
                        max="23:59"
                      />
                    </div>
                    <div className="input-group">
                      <label>🕔 End Time</label>
                      <select 
                        value={selectedEndTime}
                        onChange={(e) => setSelectedEndTime(e.target.value)}
                        className="custom-select"
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
                    <label>
                      <input
                        type="checkbox"
                        checked={isRecurring}
                        onChange={e => setIsRecurring(e.target.checked)}
                      />
                      🔄 Repeat these slots
                    </label>
                  </div>
                  
                  {isRecurring && (
                    <>
                      <div className="input-group">
                        <label>📆 Repeat Until</label>
                        <DatePicker
                          selected={repeatEndDate}
                          onChange={date => setRepeatEndDate(date)}
                          minDate={selectedDate}
                          maxDate={new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)}
                          dateFormat="MMMM d, yyyy"
                          className="custom-datepicker"
                          showPopperArrow={false}
                          popperClassName="custom-datepicker-popper"
                        />
                      </div>
                      
                      <div className="repeat-days-group">
                        <label>📋 Select Days to Repeat</label>
                        <div className="repeat-days-checkboxes" style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '0.75rem',
                          marginTop: '0.75rem',
                          justifyContent: 'center'
                        }}>
                          {weekDays.map((day) => (
                            <label key={day.value} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem',
                              backgroundColor: '#f8fafc',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              justifyContent: 'center',
                              ':hover': {
                                backgroundColor: '#f1f5f9'
                              }
                            }}>
                              <input
                                type="checkbox"
                                checked={repeatDays.includes(day.value)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setRepeatDays(prev => [...prev, day.value].sort());
                                  } else {
                                    setRepeatDays(prev => prev.filter(d => d !== day.value));
                                  }
                                }}
                                style={{
                                  margin: 0
                                }}
                              />
                              <span>{day.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {isExtendingSlot && (
                <>
                  <div className="input-group">
                    <label>Current Slot</label>
                    <div className="slot-info">
                      {selectedSlot?.startTime} - {selectedSlot?.endTime}
                    </div>
                  </div>

                  <div className="extension-options">
                    <label>
                      <input
                        type="checkbox"
                        checked={extendStart}
                        onChange={e => setExtendStart(e.target.checked)}
                      />
                      Extend Start Time
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={extendEnd}
                        onChange={e => setExtendEnd(e.target.checked)}
                      />
                      Extend End Time
                    </label>
                  </div>

                  {(extendStart || extendEnd) && (
                    <div className="input-group">
                      <label>Extension Duration (minutes)</label>
                      <input
                        type="number"
                        min="5"
                        step="5"
                        value={extensionMinutes}
                        onChange={e => setExtensionMinutes(parseInt(e.target.value))}
                        className="custom-input"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            
            <p style={{
              textAlign: 'center',
              fontSize: '0.85rem',
              color: '#718096',
              fontStyle: 'italic',
              lineHeight: '1.4',
              padding: '0 1.5rem',
              margin: '1rem 0'
            }}>
              Note: New slots may overlap with existing slots. The system will automatically arrange new slots based on your gap and duration settings, while preserving all existing slots.
            </p>

            <div className="modal-actions" style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              background: 'white'
            }}>
              <button 
                onClick={() => {
                  console.log('Add Slots button clicked'); // Debug log
                  handleAddSlots(false); // Explicitly pass false to ensure day validation
                }} 
                className="auth-button"
                disabled={loading || isDateInPast(new Date(selectedDate)) || isDateInFutureMonth(new Date(selectedDate))}
              >
                {loading ? 'Adding...' : 'Add Slots'}
              </button>
              <button 
                onClick={() => {
                  setShowSlotModal(false);
                  resetForm();
                }} 
                className="cancel-btn"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowDeleteModal(false);
          }
        }}>
          <div className="modal-content" style={{
            maxHeight: '90vh',
            width: '800px',
            position: 'relative',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ 
              margin: 0,
              padding: '1.5rem 1.5rem 1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              Delete Slots
            </h3>
            
            <div style={{ 
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              maxHeight: 'calc(90vh - 180px)' // Account for header and footer
            }}>
              <div className="input-group">
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

              <div className="input-group">
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
                <div className="input-group">
                  <label>Start Time</label>
                  <input 
                    type="time" 
                    value={deleteStartTime}
                    onChange={(e) => setDeleteStartTime(e.target.value)}
                    className="custom-time-input"
                    min="00:00"
                    max="23:59"
                  />
                </div>
                <div className="input-group">
                  <label>End Time</label>
                  <input 
                    type="time" 
                    value={deleteEndTime}
                    onChange={(e) => setDeleteEndTime(e.target.value)}
                    className="custom-time-input"
                    min="00:00"
                    max="23:59"
                  />
                </div>
              </div>

              <div style={{
                background: '#fff5f5',
                border: '1px solid #feb2b2',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginTop: '1rem',
                color: '#c53030'
              }}>
                <p style={{ margin: 0, fontWeight: 500 }}>
                  ⚠️ Warning: This action will delete all slots within the selected date and time range. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="modal-actions" style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              background: 'white'
            }}>
              <button 
                onClick={handleDeleteSlots}
                className="auth-button"
                style={{
                  background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                  color: 'white'
                }}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete All Slots'}
              </button>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="cancel-btn"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSingleDeleteModal && selectedSlotForDelete && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowSingleDeleteModal(false);
            setSelectedSlotForDelete(null);
          }
        }}>
          <div className="modal-content" style={{
            maxHeight: '90vh',
            width: '800px',
            position: 'relative',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ 
              margin: 0,
              padding: '1.5rem 1.5rem 1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              Delete Slot
            </h3>
            
            <div style={{ 
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              maxHeight: 'calc(90vh - 180px)' // Account for header and footer
            }}>
              <div className="input-group">
                <label>Date</label>
                <div style={{ 
                  padding: '0.75rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  color: '#4a5568'
                }}>
                  {new Date(selectedSlotForDelete.startTime).toLocaleDateString('default', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>

              <div className="time-inputs">
                <div className="input-group">
                  <label>Start Time</label>
                  <div style={{ 
                    padding: '0.75rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#4a5568'
                  }}>
                    {new Date(selectedSlotForDelete.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </div>
                </div>
                <div className="input-group">
                  <label>End Time</label>
                  <div style={{ 
                    padding: '0.75rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#4a5568'
                  }}>
                    {new Date(selectedSlotForDelete.endTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </div>
                </div>
              </div>

              <div style={{
                background: '#fff5f5',
                border: '1px solid #feb2b2',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginTop: '1rem',
                color: '#c53030'
              }}>
                <p style={{ margin: 0, fontWeight: 500 }}>
                  ⚠️ Warning: This action will delete the selected slot. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="modal-actions" style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              background: 'white'
            }}>
              <button 
                onClick={() => handleDeleteSlot(selectedSlotForDelete.id, selectedSlotForDelete.calendarId)}
                className="auth-button"
                style={{
                  background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                  color: 'white'
                }}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Slot'}
              </button>
              <button 
                onClick={() => {
                  setShowSingleDeleteModal(false);
                  setSelectedSlotForDelete(null);
                }}
                className="cancel-btn"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelAppointmentModal && selectedSlotForCancel && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowCancelAppointmentModal(false);
            setSelectedSlotForCancel(null);
          }
        }}>
          <div className="modal-content" style={{
            maxHeight: '90vh',
            width: '800px',
            position: 'relative',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ 
              margin: 0,
              padding: '1.5rem 1.5rem 1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              Cancel Appointment
            </h3>
            
            <div style={{ 
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              maxHeight: 'calc(90vh - 180px)' // Account for header and footer
            }}>
              <div className="input-group">
                <label>Date</label>
                <div style={{ 
                  padding: '0.75rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  color: '#4a5568'
                }}>
                  {new Date(selectedSlotForCancel.startTime).toLocaleDateString('default', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>

              <div className="time-inputs">
                <div className="input-group">
                  <label>Start Time</label>
                  <div style={{ 
                    padding: '0.75rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#4a5568'
                  }}>
                    {new Date(selectedSlotForCancel.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </div>
                </div>
                <div className="input-group">
                  <label>End Time</label>
                  <div style={{ 
                    padding: '0.75rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#4a5568'
                  }}>
                    {new Date(selectedSlotForCancel.endTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </div>
                </div>
              </div>

              <div style={{
                background: '#fff5f5',
                border: '1px solid #feb2b2',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginTop: '1rem',
                color: '#c53030'
              }}>
                <p style={{ margin: 0, fontWeight: 500 }}>
                  ⚠️ Warning: This action will cancel the appointment and make the slot available again for booking. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="modal-actions" style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              background: 'white'
            }}>
              <button 
                onClick={() => handleDeleteSlot(selectedSlotForCancel.id, selectedSlotForCancel.calendarId)}
                className="auth-button"
                style={{
                  background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                  color: 'white'
                }}
                disabled={loading}
              >
                {loading ? 'Canceling...' : 'Cancel Appointment'}
              </button>
              <button 
                onClick={() => {
                  setShowCancelAppointmentModal(false);
                  setSelectedSlotForCancel(null);
                }}
                className="cancel-btn"
                disabled={loading}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {showRescheduleModal && selectedSlotForReschedule && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowRescheduleModal(false);
            setSelectedSlotForReschedule(null);
            setSelectedNewSlot(null);
          }
        }}>
          <div className="modal-content" style={{
            maxHeight: '90vh',
            width: '800px',
            position: 'relative',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ 
              margin: 0,
              padding: '1.5rem 1.5rem 1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              Reschedule Appointment
            </h3>
            
            <div style={{ 
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              maxHeight: 'calc(90vh - 180px)' // Account for header and footer
            }}>
              <div className="input-group">
                <label>Current Appointment</label>
                <div style={{ 
                  padding: '0.75rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  color: '#4a5568'
                }}>
                  {new Date(selectedSlotForReschedule.startTime).toLocaleDateString('default', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} at {new Date(selectedSlotForReschedule.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </div>
              </div>

              <div className="input-group">
                <label>Select New Date</label>
                <div onClick={(e) => e.stopPropagation()}>
                  <DatePicker
                    selected={rescheduleDate}
                    onChange={date => setRescheduleDate(date)}
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

              <div className="input-group">
                <label>Available Slots</label>
                {rescheduleLoading ? (
                  <div style={{ textAlign: 'center', padding: '1rem' }}>
                    Loading available slots...
                  </div>
                ) : availableSlotsForReschedule.length === 0 ? (
                  <div style={{ 
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    color: '#718096',
                    minHeight: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    No available slots for the selected date
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                    minHeight: '70px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    padding: '0.5rem'
                  }}>
                    {availableSlotsForReschedule.map((slot, index) => (
                      <button
                        key={`reschedule-slot-${index}`}
                        onClick={() => setSelectedNewSlot(slot)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: selectedNewSlot?.id === slot.id ? '#f8fafc' : '#f8fafc',
                          border: `1px solid ${selectedNewSlot?.id === slot.id ? '#86bf23' : '#e2e8f0'}`,
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          textAlign: 'center',
                          fontSize: '0.9rem',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseOver={(e) => {
                          if (selectedNewSlot?.id !== slot.id) {
                            e.currentTarget.style.backgroundColor = '#edf2f7';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (selectedNewSlot?.id !== slot.id) {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                          }
                        }}
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

            <div className="modal-actions" style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              background: 'white'
            }}>
              <button 
                onClick={handleReschedule}
                className="auth-button"
                disabled={rescheduleLoading || !selectedNewSlot}
              >
                {rescheduleLoading ? 'Rescheduling...' : 'Reschedule Appointment'}
              </button>
              <button 
                onClick={() => {
                  setShowRescheduleModal(false);
                  setSelectedSlotForReschedule(null);
                  setSelectedNewSlot(null);
                }}
                className="cancel-btn"
                disabled={rescheduleLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
};

export default Schedule;