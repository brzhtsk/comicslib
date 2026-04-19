import api from './axios.instance.js';

export const getMyProfile = () => api.get('/users/me');
export const updateMyProfile = (data) => api.put('/users/me', data);
export const getPublicProfile = (id) => api.get(`/users/${id}`);
export const getActivityStats = () => api.get('/users/me/stats');