import api from './api';

export const getMarineWeather = async (lat, lng) => {
  const { data } = await api.get('/api/weather/marine', { params: { lat, lng } });
  return data;
};

export const getWeatherForecast = async (lat, lng) => {
  const { data } = await api.get('/api/weather/forecast', { params: { lat, lng } });
  return data;
};

export const getCoastalStatus = async () => {
  const { data } = await api.get('/api/weather/coastal-status');
  return data;
};
