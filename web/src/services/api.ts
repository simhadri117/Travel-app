import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// We target the local port 5000 of our Express backend
export const api = axios.create({
  baseURL: 'http://127.0.0.1:5001/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically inject JWT tokens
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Log out user on token expiration (401 response code)
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response?.status === 401) {
    useAuthStore.getState().logout();
  }
  return Promise.reject(error);
});
