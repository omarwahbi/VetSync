import axios from 'axios';
import { useAuthStore } from '../store/auth';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/',
  withCredentials: true, // Essential for sending cookies with requests
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  
  return config;
});

// Response interceptor for error handling and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Track retry attempts
    if (originalRequest._retryCount === undefined) {
      originalRequest._retryCount = 0;
    }
    
    const MAX_RETRIES = 3;
    
    // Handle 401 Unauthorized with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Request a new access token using refresh token (sent automatically via cookie)
        const refreshResponse = await axiosInstance.post('/auth/refresh');
        const newAccessToken = refreshResponse.data.access_token;
        
        // If no token is returned, handle gracefully without retrying
        if (!newAccessToken) {
          console.log('No refresh token available or token expired');
          useAuthStore.getState().logout();
          
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            console.log("Redirecting to login due to missing token.");
            window.location.href = '/login';
          }
          
          return Promise.reject(error);
        }
        
        // Update auth store with new token
        useAuthStore.getState().setAccessToken(newAccessToken);
        
        // Update the failed request with the new token
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        
        // Retry the original request with the new token
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.log('Error refreshing token:', refreshError);
        useAuthStore.getState().logout();
        
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // Handle server errors (5xx) and network errors with retry logic and exponential backoff
    const isServerError = error.response?.status >= 500;
    const isNetworkError = error.message === 'Network Error' || !error.response;
    
    if ((isServerError || isNetworkError) && originalRequest._retryCount < MAX_RETRIES) {
      originalRequest._retryCount++;
      
      // Calculate delay with exponential backoff (1s, 2s, 4s)
      const delay = Math.pow(2, originalRequest._retryCount - 1) * 1000;
      
      console.log(`Retrying request (${originalRequest._retryCount}/${MAX_RETRIES}) after ${delay}ms`);
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the request
      return axiosInstance(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 