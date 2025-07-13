import tokenService from '../services/tokenService';

/**
 * Utility function to handle logout with proper cleanup
 * This should be called from all logout handlers across the app
 */
export const handleLogout = () => {
  if (window.confirm('Are you sure you want to logout?')) {
    console.log('🔄 User confirmed logout - starting cleanup process');
    tokenService.clearTokens();
    sessionStorage.clear();
    document.cookie.split(';').forEach(function(c) {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    console.log('✅ Local storage and session data cleared');
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
    if (disconnectFromAllChats) {
      disconnectFromAllChats();
    }
    tokenService.clearTokens();
    sessionStorage.clear();
    document.cookie.split(';').forEach(function(c) {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    console.log('✅ All data cleared and WebSocket connections closed');
    window.location.href = '/login';
  }
}; 