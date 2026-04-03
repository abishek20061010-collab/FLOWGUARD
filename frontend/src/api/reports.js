import api from './api';

export const createReport = async (formData) => {
  // formData should be a FormData object containing category, description, latitude, longitude, and file
  const { data } = await api.post('/api/reports', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const getMyReports = async (page = 1, limit = 10, status = '', category = '') => {
  const params = { page, limit };
  if (status && status !== 'all') params.status = status;
  if (category) params.category = category;
  
  const { data } = await api.get('/api/reports', { params });
  return data;
};

export const getReportById = async (id) => {
  const { data } = await api.get(`/api/reports/${id}`);
  return data;
};
