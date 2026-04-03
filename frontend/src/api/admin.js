import api from './api';

export const getDashboardInfo = async () => {
  const { data } = await api.get('/api/admin/dashboard');
  return data;
};

export const getAllReports = async (page = 1, limit = 50, filters = {}) => {
  const params = { page, limit, ...filters };
  const { data } = await api.get('/api/admin/reports', { params });
  return data;
};

export const getClusteredReports = async () => {
  const { data } = await api.get('/api/admin/reports/clustered');
  return data;
};

export const updateReportStatus = async (id, status, assigned_to = null, resolutionFile = null) => {
  let payload;
  let headers = {};
  
  if (resolutionFile) {
    payload = new FormData();
    payload.append('status', status);
    if (assigned_to) payload.append('assigned_to', assigned_to);
    payload.append('file', resolutionFile);
    headers['Content-Type'] = 'multipart/form-data';
  } else {
    payload = { status };
    if (assigned_to) payload.assigned_to = assigned_to;
  }

  const { data } = await api.patch(`/api/admin/reports/${id}/status`, payload, { headers });
  return data;
};

export const getAllSOS = async () => {
  const { data } = await api.get('/api/admin/sos');
  return data;
};

export const getAllZones = async () => {
  const { data } = await api.get('/api/admin/zones');
  return data;
};
