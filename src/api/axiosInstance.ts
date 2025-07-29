import axios from 'axios';
import { timeMachineService } from '../services/TimeMachineService';

const axiosInstance = axios.create({
  baseURL: 'https://site242534.tw.cs.unibo.it/api/',
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const virtualTime = timeMachineService.getCurrentTime().toISOString();
    config.params = {
      ...config.params,
      virtualTime,
    };
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
