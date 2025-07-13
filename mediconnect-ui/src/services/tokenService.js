class TokenService {
  constructor() {
    this.accessTokenKey = 'accessToken';
    this.refreshTokenKey = 'refreshToken';
    this.userKey = 'user';
    this.refreshPromise = null;
    this.refreshTimer = null;
    this.lastActivityTime = Date.now();
    this.maxInactiveTime = 15 * 60 * 1000; // 15 minutes of inactivity
    this.broadcastChannel = null;
    this.setupBroadcastChannel();
    this.setupAutomaticRefresh();
    this.setupActivityTracking();
  }

  // Store tokens
  setTokens(accessToken, refreshToken) {
    localStorage.setItem(this.accessTokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
    this.setupAutomaticRefresh();
  }

  // Get access token
  getAccessToken() {
    return localStorage.getItem(this.accessTokenKey);
  }

  // Get refresh token
  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Store user data
  setUser(user) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Get user data
  getUser() {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Setup broadcast channel for cross-tab communication
  setupBroadcastChannel() {
    try {
      this.broadcastChannel = new BroadcastChannel('mediconnect-session');
      this.broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'LOGOUT') {
          console.log('Received logout broadcast from another tab');
          this.handleLogoutFromOtherTab();
        } else if (event.data.type === 'ACTIVITY_UPDATE') {
          console.log('Received activity update from another tab');
          this.lastActivityTime = event.data.timestamp;
        }
      };
    } catch (error) {
      console.warn('BroadcastChannel not supported, falling back to localStorage events');
      this.setupLocalStorageEvents();
    }
  }

  // Fallback for browsers that don't support BroadcastChannel
  setupLocalStorageEvents() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'mediconnect-logout') {
        console.log('Received logout event from localStorage');
        this.handleLogoutFromOtherTab();
      }
    });
  }

  // Handle logout from another tab
  handleLogoutFromOtherTab() {
    this.clearTokens();
    window.location.href = '/login?message=session_expired';
  }

  // Broadcast logout to other tabs
  broadcastLogout() {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'LOGOUT' });
    } else {
      // Fallback for browsers without BroadcastChannel
      localStorage.setItem('mediconnect-logout', Date.now().toString());
      localStorage.removeItem('mediconnect-logout');
    }
  }

  // Broadcast activity update to other tabs
  broadcastActivity() {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ 
        type: 'ACTIVITY_UPDATE', 
        timestamp: Date.now() 
      });
    }
  }

  // Clear all tokens and user data
  clearTokens() {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    this.clearRefreshTimer();
    this.removeActivityListeners();
    this.broadcastLogout(); // Notify other tabs
  }

  // Clear refresh timer
  clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Setup activity tracking
  setupActivityTracking() {
    this.removeActivityListeners();
    
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, this.updateActivity.bind(this), true);
    });

    // Also track visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  // Remove activity listeners
  removeActivityListeners() {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.removeEventListener(event, this.updateActivity.bind(this), true);
    });

    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Close broadcast channel
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }

  // Update activity timestamp
  updateActivity() {
    this.lastActivityTime = Date.now();
    this.broadcastActivity(); // Share activity with other tabs
  }

  // Handle visibility change (tab switching)
  handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // Check if user was inactive for too long
      const timeSinceLastActivity = Date.now() - this.lastActivityTime;
      if (timeSinceLastActivity > this.maxInactiveTime) {
        console.log('User inactive for too long, logging out all tabs');
        this.clearTokens();
        window.location.href = '/login?message=session_expired';
        return;
      }
      this.updateActivity();
    }
  }

  // Check if user is inactive
  isUserInactive() {
    const timeSinceLastActivity = Date.now() - this.lastActivityTime;
    return timeSinceLastActivity > this.maxInactiveTime;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  // Setup automatic token refresh
  setupAutomaticRefresh() {
    this.clearRefreshTimer();
    
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    
    if (!accessToken || !refreshToken) {
      return;
    }

    // Check if user has been inactive for too long
    if (this.isUserInactive()) {
      console.log('User inactive for too long, not setting up refresh');
      return;
    }

    try {
      // Parse access token to get expiration
      const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
      const expirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;

      // Trigger refresh 1 minute before expiration
      const refreshTime = timeUntilExpiry - 60000; // 1 minute before expiry
      
      console.log(`🔄 Setting up refresh timer for ${refreshTime}ms (1 minute before expiry)`);
      
      this.refreshTimer = setTimeout(() => {
        console.log('🔄 Triggering refresh token (1 minute before expiry)');
        this.silentRefresh();
      }, refreshTime);

    } catch (error) {
      console.error('Error setting up automatic refresh:', error);
    }
  }

  // Silent refresh (background refresh without user interaction)
  async silentRefresh() {
    // Check if user has been inactive for too long
    if (this.isUserInactive()) {
      console.log('User inactive for too long, logging out all tabs');
      this.clearTokens();
      window.location.href = '/login?message=session_expired';
      return;
    }

    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        console.log('No refresh token available, will logout when access token expires');
        return;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        // Store new tokens (both access and refresh tokens are renewed)
        this.setTokens(data.accessToken, data.refreshToken);
        this.setUser(data.user);
        console.log('Tokens refreshed silently');
      } else if (response.status === 401) {
        // 401 means unauthorized - logout immediately
        console.log('Refresh token returned 401, logging out all tabs');
        this.clearTokens();
        window.location.href = '/login?message=session_expired';
      } else {
        // Other errors (500, 400, etc.) - don't logout, just log the error
        console.log(`Refresh token failed with status ${response.status}, but access token is still valid. Will logout when access token expires.`);
        // Don't clear tokens or redirect - let access token handle logout
      }
    } catch (error) {
      console.error('Silent refresh failed:', error);
      // Don't logout immediately on network errors
      // User can continue until access token expires
      console.log('Refresh failed due to network error, but access token is still valid. Will logout when access token expires.');
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken() {
    // If there's already a refresh in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: refreshToken })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      return response.json();
    })
    .then(data => {
      // Store new tokens
      this.setTokens(data.accessToken, data.refreshToken);
      this.setUser(data.user);
      return data.accessToken;
    })
    .finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  // Get authorization header with automatic token refresh
  async getAuthHeader() {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      return null;
    }

    try {
      // Check if token is about to expire (within 30 seconds)
      const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
      const expirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;

      // If token expires in less than 30 seconds, trigger silent refresh
      if (timeUntilExpiry < 30000) {
        await this.silentRefresh();
        const newAccessToken = this.getAccessToken();
        return newAccessToken ? `Bearer ${newAccessToken}` : null;
      }

      return `Bearer ${accessToken}`;
    } catch (error) {
      console.error('Error processing token:', error);
      // If token is malformed, try silent refresh
      try {
        await this.silentRefresh();
        const newAccessToken = this.getAccessToken();
        return newAccessToken ? `Bearer ${newAccessToken}` : null;
      } catch (refreshError) {
        // If refresh fails, don't clear tokens immediately
        // Let the access token handle logout when it expires
        console.log('Token processing failed and refresh failed, but will continue until access token expires');
        return `Bearer ${accessToken}`; // Return current token even if malformed
      }
    }
  }

  // Make authenticated API call with automatic token refresh
  async authenticatedFetch(url, options = {}) {
    const authHeader = await this.getAuthHeader();
    
    if (!authHeader) {
      throw new Error('No valid authentication token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': authHeader,
      },
    });

    // If we get a 401, try to refresh the token and retry once
    if (response.status === 401) {
      try {
        await this.silentRefresh();
        const newAuthHeader = await this.getAuthHeader();
        
        if (newAuthHeader) {
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': newAuthHeader,
            },
          });
          return retryResponse;
        } else {
          // If we can't get a new auth header after refresh, logout
          console.log('401 received and refresh failed, logging out user');
          this.clearTokens();
          window.location.href = '/login?message=session_expired';
          throw new Error('Authentication failed');
        }
      } catch (refreshError) {
        // If refresh fails, logout immediately
        console.log('401 received and refresh failed, logging out user');
        this.clearTokens();
        window.location.href = '/login?message=session_expired';
        throw new Error('Authentication failed');
      }
    }

    return response;
  }
}

// Create singleton instance
const tokenService = new TokenService();
export default tokenService; 