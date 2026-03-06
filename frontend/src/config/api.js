/**
 * API Configuration
 * Uses environment variable in production, relative paths in development (via Vite proxy)
 */

const rawApiBase = (import.meta.env.VITE_API_URL || '').trim();
const trimmedBase = rawApiBase.replace(/\/+$/, '');

// Accept both forms in env: https://host or https://host/api
const API_BASE_URL = trimmedBase.endsWith('/api')
  ? trimmedBase.slice(0, -4)
  : trimmedBase;

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  
  // Documents
  UPLOAD: `${API_BASE_URL}/api/documents/upload`,
  GET_DOCUMENT: (docId) => `${API_BASE_URL}/api/documents/${docId}/file`,
  
  // Query
  ASK: `${API_BASE_URL}/api/query/ask`,
  SEARCH: `${API_BASE_URL}/api/query/search`,
  SUMMARY: `${API_BASE_URL}/api/query/summary`,
  
  // Citations
  GET_CITATIONS: (messageId) => `${API_BASE_URL}/api/citations/${messageId}`,
};

/**
 * Helper to get authorization headers
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Helper for API calls with automatic auth headers
 */
export const apiCall = async (url, options = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete defaultOptions.headers['Content-Type'];
  }

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json().catch(() => response);
};

export default API_BASE_URL;
