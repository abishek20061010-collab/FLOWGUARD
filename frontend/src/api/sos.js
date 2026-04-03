import api from './api';

export const triggerSOS = async (latitude, longitude) => {
  const { data } = await api.post('/api/sos/trigger', { latitude, longitude });
  return data;
};

export const getMySOS = async () => {
  const { data } = await api.get('/api/sos/my');
  return data;
};
