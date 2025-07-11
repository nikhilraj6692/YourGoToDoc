/**
 * Utility function to handle logout with proper cleanup
 * This should be called from all logout handlers across the app
 */
export const handleLogout = () => {
  if (window.confirm('Are you sure you want to logout?')) {
    console.log('🔄 User confirmed logout - starting cleanup process');
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear any other stored data
    sessionStorage.clear();
    
    // Clear any cookies if needed
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('✅ Local storage and session data cleared');
    
    // Redirect to login page
    window.location.href = '/login';
  }
};

/**
 * Enhanced logout function that accepts a WebSocket cleanup function
 * Use this when you have access to the ChatContext
 */
export const handleLogoutWithWebSocketCleanup = (disconnectFromAllChats) => {
  if (window.confirm('Are you sure you want to logout?')) {
    console.log('🔄 User confirmed logout - starting cleanup process');
    
    // Close all WebSocket connections first
    if (disconnectFromAllChats) {
      disconnectFromAllChats();
    }
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear any other stored data
    sessionStorage.clear();
    
    // Clear any cookies if needed
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('✅ All data cleared and WebSocket connections closed');
    
    // Redirect to login page
    window.location.href = '/login';
  }
}; 