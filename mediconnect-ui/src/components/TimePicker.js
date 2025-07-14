import React from 'react';
import './TimePicker.css';

const TimePicker = ({ 
  value, 
  onChange, 
  min = "00:00", 
  max = "23:59", 
  className = "custom-time-input",
  disabled = false,
  placeholder = "Select time",
  error = false
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const inputClassName = `${className}${error ? ' error' : ''}`;

  return (
    <input 
      type="time" 
      value={value}
      onChange={handleChange}
      className={inputClassName}
      min={min}
      max={max}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
};

export default TimePicker; 