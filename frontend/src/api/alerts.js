import api from './api';

export const getAlerts = async (active_only = true, lat = null, lng = null) => {
  const params = { active_only };
  if (lat && lng) {
    params.lat = lat;
    params.lng = lng;
  }
  const { data } = await api.get('/api/alerts', { params });
  return data;
};
