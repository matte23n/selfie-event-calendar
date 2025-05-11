import axios from 'axios';
import { timeMachineService } from '../services/TimeMachineService';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api',
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
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
