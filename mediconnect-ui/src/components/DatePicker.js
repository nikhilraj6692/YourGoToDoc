import React from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './DatePicker.css';

const DatePicker = ({ 
  selected, 
  onChange, 
  minDate = new Date(),
  maxDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  dateFormat = "MMMM d, yyyy",
  className = "custom-datepicker",
  showPopperArrow = false,
  popperClassName = "custom-datepicker-popper",
  popperPlacement = "bottom",
  calendarClassName = "custom-calendar",
  placeholderText = "Select date",
  disabled = false,
  ...props
}) => {
  return (
    <ReactDatePicker
      selected={selected}
      onChange={onChange}
      minDate={minDate}
      maxDate={maxDate}
      dateFormat={dateFormat}
      className={className}
      showPopperArrow={showPopperArrow}
      popperClassName={popperClassName}
      popperPlacement={popperPlacement}
      calendarClassName={calendarClassName}
      placeholderText={placeholderText}
      disabled={disabled}
      {...props}
    />
  );
};

export default DatePicker; 