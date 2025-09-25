// services/api.ts
import { API_URL } from '../utils/constants';

export const getAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem("token");
  console.log("Current token being sent:", token);
  return token ? { Authorization: `Bearer ${token}` } : {};
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP Error (${response.status}): ${errorData.detail || response.statusText}`);
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP Error (${response.status}): ${errorData.detail || response.statusText}`);
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP Error (${response.status}): ${errorData.detail || response.statusText}`);
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP Error (${response.status}): ${errorData.detail || response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient(API_URL);