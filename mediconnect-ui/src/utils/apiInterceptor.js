// Global API Interceptor - Automatically handles all API calls
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

// Store original fetch
const originalFetch = window.fetch;

// Override fetch globally
window.fetch = function(url, options = {}) {
  // Only intercept API calls (URLs starting with /api/)
  if (typeof url === 'string' && url.startsWith('/api/')) {
    const fullUrl = API_BASE_URL + url;
    console.log(`🔄 API Interceptor: ${url} → ${fullUrl}`);
    return originalFetch(fullUrl, options);
  }
  
  // Pass through non-API calls unchanged
  return originalFetch(url, options);
};

// Also override axios if it's used
if (window.axios) {
  const originalAxios = window.axios;
  window.axios = {
    ...originalAxios,
    get: function(url, config) {
      if (typeof url === 'string' && url.startsWith('/api/')) {
        const fullUrl = API_BASE_URL + url;
        console.log(`🔄 Axios Interceptor: ${url} → ${fullUrl}`);
        return originalAxios.get(fullUrl, config);
      }
      return originalAxios.get(url, config);
    },
    post: function(url, data, config) {
      if (typeof url === 'string' && url.startsWith('/api/')) {
        const fullUrl = API_BASE_URL + url;
        console.log(`🔄 Axios Interceptor: ${url} → ${fullUrl}`);
        return originalAxios.post(fullUrl, data, config);
      }
      return originalAxios.post(url, data, config);
    },
    put: function(url, data, config) {
      if (typeof url === 'string' && url.startsWith('/api/')) {
        const fullUrl = API_BASE_URL + url;
        console.log(`🔄 Axios Interceptor: ${url} → ${fullUrl}`);
        return originalAxios.put(fullUrl, data, config);
      }
      return originalAxios.put(url, data, config);
    },
    delete: function(url, config) {
      if (typeof url === 'string' && url.startsWith('/api/')) {
        const fullUrl = API_BASE_URL + url;
        console.log(`🔄 Axios Interceptor: ${url} → ${fullUrl}`);
        return originalAxios.delete(fullUrl, config);
      }
      return originalAxios.delete(url, config);
    }
  };
}

console.log('✅ API Interceptor loaded. Base URL:', API_BASE_URL || 'Using proxy (development)'); 