/**
 * API Configuration
 * Uses environment variable in production, relative paths in development (via Vite proxy)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  
  // Documents
  UPLOAD: `${API_BASE_URL}/documents/upload`,
  GET_DOCUMENT: (docId) => `${API_BASE_URL}/documents/${docId}/file`,
  
  // Query
  ASK: `${API_BASE_URL}/query/ask`,
  SEARCH: `${API_BASE_URL}/query/search`,
  SUMMARY: `${API_BASE_URL}/query/summary`,
  
  // Citations
  GET_CITATIONS: (messageId) => `${API_BASE_URL}/citations/${messageId}`,
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
