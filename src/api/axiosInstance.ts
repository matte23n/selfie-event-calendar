import axios from 'axios';
import { timeMachineService } from '../services/TimeMachineService';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: 'https://site242534.tw.cs.unibo.it/api/',
  timeout: 10000,
});

// Add request interceptor to include virtualTime in every request
axiosInstance.interceptors.request.use(
  (config) => {
    // Add virtual time to all requests
    const virtualTime = timeMachineService.getCurrentTime().toISOString();
    
    // Append virtualTime as query parameter
    config.params = {
      ...config.params,
      virtualTime: virtualTime,
    };
    
    // Add token to headers if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
