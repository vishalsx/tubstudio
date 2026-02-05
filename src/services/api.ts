// services/api.ts
import { API_URL } from '../utils/constants';

export const getAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem("token");
  // console.log("Current token being sent:", token);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Format user-friendly error messages based on status codes and error details
const formatUserFriendlyError = (status: number, errorDetail: string): string => {
  // Common error patterns and their user-friendly messages
  const errorMessages: Record<number, string> = {
    400: "Invalid request. Please check your input and try again.",
    403: "You don't have permission to perform this action.",
    404: "The requested resource was not found.",
    408: "Request timeout. Please try again.",
    409: "This action conflicts with existing data.",
    413: "The file is too large. Please use a smaller image.",
    422: "Unable to process the data provided.",
    429: "Too many requests. Please wait a moment and try again.",
    500: "Server error. Please try again later.",
    502: "Server is temporarily unavailable. Please try again.",
    503: "Service unavailable. Please try again later.",
    504: "Server timeout. Please try again.",
  };

  // Get base message for the status code
  let message = errorMessages[status] || "An unexpected error occurred.";

  // If backend provides a meaningful detail message, use it
  if (errorDetail && errorDetail.length > 0) {
    // 1. Internal status text check (if it's just repeating the status code label, skip it)
    const isGenericSystemError = /^(Internal Server Error|Bad Request|Not Found|Forbidden|Unauthorized)$/i.test(errorDetail.trim());
    if (isGenericSystemError) return message;

    // 2. Clean common technical prefixes and jargon
    let cleanDetail = errorDetail
      .replace(/^\d+:\s*/, '')           // Remove status code prefix like "500: "
      .replace(/ObjectId\('([^']+)'\)/g, '$1') // Strip ObjectId wrapper
      .replace(/image_lexicon\.\w+ /g, '')      // Strip collection names
      .replace(/(AttributeError|TypeError|KeyError|ValueError|JSONDecodeError|ClientError|JWTError|PNGErr):\s*/gi, '') // Strip Python/AWS error types
      .replace(/Processing error[:\s]*/i, 'Processing failed. ')
      .replace(/Database error[:\s]*/i, 'Storage error: ')
      .replace(/image_hash/g, 'reference ID')
      .replace(/user_comments/g, 'comments')
      .replace(/object_key/g, 'storage path')
      .replace(/sequence number/g, 'ID sequence')
      .trim();

    // 3. Catch specific technical patterns and translate to user-friendly text
    if (cleanDetail.includes('E11000 duplicate key error')) {
      cleanDetail = "The item you're trying to save already exists. Please check if this ID or title is already in use.";
    } else if (cleanDetail.includes('validation error') || cleanDetail.includes('value_error')) {
      cleanDetail = "The information provided is in an incorrect format. Please check your entries.";
    } else if (cleanDetail.includes('Nologged-in user found') || cleanDetail.includes('Invalid authentication token')) {
      cleanDetail = "Your session has expired or is invalid. Please log in again.";
    }

    // 4. Final aggregation
    if (cleanDetail && cleanDetail.length > 3) {
      // If the base message is empty or generic, use the detail as primary
      if (message.includes('unexpected error') || message === "Server error. Please try again later.") {
        return cleanDetail;
      }
      return `${message} ${cleanDetail}`;
    }
  }

  return message;
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
    throw new Error('Your session has expired. Please log in again.');
  }

  // Parse error details from the response
  const errorData = await response.json().catch(() => ({}));
  let errorDetail = errorData.detail || errorData.message || response.statusText;

  // Handle case where errorDetail is an object (e.g. validation summary)
  let detailString = "";
  if (typeof errorDetail === 'object' && errorDetail !== null) {
    detailString = errorDetail.message || JSON.stringify(errorDetail);
  } else {
    detailString = String(errorDetail);
  }

  // Format and throw user-friendly error
  const userFriendlyMessage = formatUserFriendlyError(response.status, detailString);
  const error = new Error(userFriendlyMessage);
  (error as any).data = errorData;
  throw error;
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
    // console.log("GET request to:", `${this.baseUrl}${endpoint}`, "Response status:", response.status, "Response", response);
    if (!response.ok) {
      // Use the centralized error handler.
      await handleResponseError(response);
    }

    return response.json();
  }

  async post(endpoint: string, body?: any, options: RequestInit = {}) {
    // FIX: Use Headers constructor for robust header management. This resolves
    // the TypeScript error caused by spreading different types of HeadersInit.
    const headers = new Headers({
      Accept: 'application/json',
      ...getAuthHeaders(),
    });

    if (options.headers) {
      new Headers(options.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }

    let requestBody: BodyInit | null | undefined = body;

    // Handle different body types to ensure correct formatting and Content-Type.
    if (body instanceof FormData) {
      // For FormData, the browser sets the Content-Type header automatically with the correct boundary.
      // We must delete any 'Content-Type' set manually to avoid conflicts.
      headers.delete('Content-Type');
      requestBody = body;
    } else if (body instanceof URLSearchParams) {
      // For URLSearchParams, the body is passed as-is. The caller is responsible for setting
      // the 'application/x-www-form-urlencoded' Content-Type header.
      requestBody = body;
    } else if (body && typeof body === 'object') {
      // For plain JavaScript objects, stringify them and set the JSON Content-Type header
      // if it hasn't been set by the caller.
      requestBody = JSON.stringify(body);
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    }
    console.log("POST request to:", `${this.baseUrl}${endpoint}`, "Request body:", requestBody);
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      body: requestBody,
      ...options,
      headers: headers,
    });

    if (!response.ok) {
      // Use the centralized error handler.
      await handleResponseError(response);
    }
    console.log("POST response from:", `${this.baseUrl}${endpoint}`, "Response status:", response.status, "Response", response);
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