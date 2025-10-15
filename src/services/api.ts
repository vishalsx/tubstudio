// services/api.ts
import { API_URL } from '../utils/constants';

export const getAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem("token");
  console.log("Current token being sent:", token);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Centralized error handler to catch and manage API response errors.
const handleResponseError = async (response: Response) => {
  // If the error is a 401 Unauthorized, it means the token is invalid or expired.
  if (response.status === 401) {
    // Lazy import the authService to prevent circular dependencies.
    const { authService } = await import('./auth.services');
    // Call the logout function, which will clear session data and redirect to the login page.
    authService.logout();
    // Throw an error to stop the current promise chain. The redirect will happen shortly after.
    throw new Error('401: Invalid authentication token. Session expired.');
  }
  
  // For any other error, parse the response and throw a generic error.
  const errorData = await response.json().catch(() => ({}));
  throw new Error(`HTTP Error (${response.status}): ${errorData.detail || response.statusText}`);
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Use the centralized error handler.
      await handleResponseError(response);
    }

    return response.json();
  }

  async post(endpoint: string, body?: any, options: RequestInit = {}) {
    const isFormData = body instanceof FormData;
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      body: body,
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        Accept: "application/json",
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Use the centralized error handler.
      await handleResponseError(response);
    }

    return response.json();
  }

  async put(endpoint: string, body?: any, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      body: typeof body === 'object' && !(body instanceof FormData) ? JSON.stringify(body) : body,
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Use the centralized error handler.
      await handleResponseError(response);
    }

    return response.json();
  }

  async delete(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
      ...options,
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Use the centralized error handler.
      await handleResponseError(response);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient(API_URL);