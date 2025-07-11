import React, { useEffect, useState } from 'react';
import './Toast.css';

const Toast = ({ 
  message, 
  type = 'success', 
  title,
  onClose, 
  duration = 4000,
  showProgress = true 
}) => {
  const [isVisible, setIsVisible] = useState(true);


  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`toast ${type}`}>
      <div className="toast-content">
    
        <div className="toast-message">
          {title && <div className="toast-title">{title}</div>}
          <div className={title ? "toast-description" : ""}>{message}</div>
        </div>
      </div>
      
      {showProgress && duration > 0 && (
        <div 
          className="toast-progress" 
          style={{ 
            animation: `progress ${duration}ms linear forwards` 
          }}
        />
      )}
    </div>
  );
};

// Toast Container Component
export const ToastContainer = ({ toasts, removeToast }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          title={toast.title}
          type={toast.type}
          duration={toast.duration}
          showProgress={toast.showProgress}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// Custom Hook for Toast Management
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toastData) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 4000,
      showProgress: true,
      ...toastData
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const removeAllToasts = () => {
    setToasts([]);
  };

  // Convenience methods
  const showSuccess = (message, options = {}) => {
    return addToast({ ...options, message, type: 'success' });
  };

  const showError = (message, options = {}) => {
    return addToast({ ...options, message, type: 'error' });
  };

  const showWarning = (message, options = {}) => {
    return addToast({ ...options, message, type: 'warning' });
  };

  const showInfo = (message, options = {}) => {
    return addToast({ ...options, message, type: 'info' });
  };

  const showLoading = (message, options = {}) => {
    return addToast({ 
      ...options, 
      message, 
      type: 'loading', 
      duration: 0, // Loading toasts don't auto-dismiss
      showProgress: false 
    });
  };

  return {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading
  };
};

export default Toast;