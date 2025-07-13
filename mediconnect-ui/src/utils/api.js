// API utility functions
import tokenService from '../services/tokenService';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

export const fetchWithAuth = async (endpoint, options = {}) => {
  if (!tokenService.isAuthenticated()) {
    throw new Error('No authentication token found');
  }

  const authHeader = await tokenService.getAuthHeader();
  if (!authHeader) {
    throw new Error('No valid authentication token available');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': authHeader,
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    // Handle 401 Unauthorized responses - logout for ALL endpoints including refresh
    if (response.status === 401) {
      console.log('401 received, logging out user');
      tokenService.clearTokens();
      
      // Try to parse error response
      let errorMessage = 'Authentication failed. Please login again.';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If we can't parse the error response, use default message
        console.warn('Could not parse 401 error response:', e);
      }
      
      // Redirect to login page
      window.location.href = '/login';
      throw new Error(errorMessage);
    }
    
    // Handle other error responses (500, 400, etc.) - don't logout, just throw error
    try {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    } catch (e) {
      // If we can't parse the error response, throw a generic error
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  return response.json();
};

// Utility function to get user profile
export const getProfile = async () => {
  return fetchWithAuth('/api/profile');
};

// Utility function to logout user
export const logout = () => {
  tokenService.clearTokens();
  window.location.href = '/login';
}; 