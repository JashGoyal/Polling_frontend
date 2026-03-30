import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Poll APIs
export const pollAPI = {
  getAll: (params) => api.get('/polls', { params }),
  getOne: (id) => api.get(`/polls/${id}`),
  getMine: () => api.get('/polls/my-polls'),
  create: (data) => api.post('/polls', data),
  vote: (id, optionId) => api.post(`/polls/${id}/vote`, { optionId }),
  close: (id) => api.put(`/polls/${id}/close`),
  delete: (id) => api.delete(`/polls/${id}`),
  getByToken: (token) => api.get(`/polls/share/${token}`),
};

// User APIs
export const userAPI = {
  getDashboard: () => api.get('/users/dashboard'),
  updateProfile: (data) => api.put('/users/profile', data),
};

export default api;
