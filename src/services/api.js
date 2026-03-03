import axios from 'axios';
import { API_URL } from '../constants/config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

export const fetchAlerts = async () => {
  try {
    const response = await api.get('/alerts');
    return response.data;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
};

export const fetchAlertsNearby = async (lat, lng, radius = 50) => {
  try {
    const response = await api.get('/alerts/nearby', {
      params: { lat, lng, radius }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching nearby alerts:', error);
    return [];
  }
};

export const reportAlert = async (alertData) => {
  try {
    const response = await api.post('/alerts/report', alertData);
    return response.data;
  } catch (error) {
    console.error('Error reporting alert:', error);
    throw error;
  }
};

export const fetchStatistics = async () => {
  try {
    const response = await api.get('/statistics');
    return response.data;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return {
      total: 0,
      high: 0,
      medium: 0,
      low: 0
    };
  }
};

export default api;
