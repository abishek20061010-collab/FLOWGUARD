import api from './api';

export const loginUser = async (email, password) => {
  const { data } = await api.post('/api/auth/login', { email, password });
  return data;
};

export const registerUser = async (userData) => {
  const { data } = await api.post('/api/auth/register', userData);
  return data;
};

export const logoutUser = async () => {
  const { data } = await api.post('/api/auth/logout');
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/api/auth/me');
  return data;
};

export const completeProfileApi = async (phone_number, role, full_name = null) => {
  const { data } = await api.post('/api/auth/complete-profile', {
    phone_number,
    role,
    full_name
  });
  return data;
};
