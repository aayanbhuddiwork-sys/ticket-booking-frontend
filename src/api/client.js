import axios from 'axios';
import { logActivity, describeActivity } from './activityLog';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.metadata = { startTime: Date.now() };
  return config;
});

client.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime;
    logActivity({
      time: new Date().toLocaleTimeString(),
      status: response.status,
      ok: true,
      duration,
      text: describeActivity(response.config.method.toUpperCase(), response.config.url, response.status),
    });
    return response;
  },
  (error) => {
    const config = error.config || {};
    const status = error.response?.status ?? 0;
    const duration = config.metadata ? Date.now() - config.metadata.startTime : null;
    logActivity({
      time: new Date().toLocaleTimeString(),
      status,
      ok: false,
      duration,
      text: describeActivity((config.method || '?').toUpperCase(), config.url || '', status),
    });
    return Promise.reject(error);
  }
);

export default client;
