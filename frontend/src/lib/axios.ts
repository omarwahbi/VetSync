import axios from 'axios';
import { useAuthStore } from '../store/auth';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/',
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth state
      useAuthStore.getState().logout();
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 