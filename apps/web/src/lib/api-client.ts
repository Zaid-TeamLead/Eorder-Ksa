import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

/**
 * Centralized API client for all HTTP requests
 * Eliminates duplicate axios configuration across service files
 * Provides consistent error handling and response unwrapping
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Response interceptor for consistent data unwrapping and error handling
    this.client.interceptors.response.use(
      (response) => {
        // Unwrap response.data.data if it exists, otherwise return response.data
        return response.data?.data !== undefined ? response.data.data : response.data;
      },
      (error: AxiosError) => {
        // Handle 401 Unauthorized - redirect to login
        if (error.response?.status === 401) {
          // Only redirect if we're in the browser
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }

        // Re-throw the error for the caller to handle
        throw error;
      }
    );
  }

  /**
   * GET request
   * @param url - API endpoint (e.g., '/api/enquiries')
   * @param config - Optional axios request config
   * @returns Promise with unwrapped response data
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config);
  }

  /**
   * POST request
   * @param url - API endpoint
   * @param data - Request payload
   * @param config - Optional axios request config
   * @returns Promise with unwrapped response data
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(url, data, config);
  }

  /**
   * PUT request
   * @param url - API endpoint
   * @param data - Request payload
   * @param config - Optional axios request config
   * @returns Promise with unwrapped response data
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put(url, data, config);
  }

  /**
   * PATCH request
   * @param url - API endpoint
   * @param data - Request payload
   * @param config - Optional axios request config
   * @returns Promise with unwrapped response data
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.patch(url, data, config);
  }

  /**
   * DELETE request
   * @param url - API endpoint
   * @param config - Optional axios request config
   * @returns Promise with unwrapped response data
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
