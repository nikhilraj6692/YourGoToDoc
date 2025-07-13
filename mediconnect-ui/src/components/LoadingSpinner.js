import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '1.1rem',
      color: '#64748b'
    }}>
      {message}
    </div>
  );
};

export default LoadingSpinner; 