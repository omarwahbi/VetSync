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
    
    // If error is 401 and we haven't tried to refresh the token yet
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
      } catch (refreshError: unknown) {
        console.error('Token refresh failed:', refreshError);
        
        // Force local logout: Clear token/user from Zustand state
        useAuthStore.getState().logout();
        
        // Force redirect to login page (using window.location is more forceful)
        // Check if window exists (prevent server-side errors) and not already on login
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          console.log("Redirecting to login due to refresh failure.");
          window.location.href = '/login';
        }
        
        // Crucially, REJECT the promise to stop the interceptor chain 
        // and prevent the original request from being retried incorrectly
        return Promise.reject(refreshError);
      }
    }
    
    // If error is not 401 or we've already tried to refresh, just reject with original error
    return Promise.reject(error);
  }
);

export default axiosInstance; 