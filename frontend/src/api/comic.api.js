import api from './axios.instance.js';

export const getComics = (params) => api.get('/comics', { params });
export const getComic = (id) => api.get(`/comics/${id}`);
export const createComic = (data) => api.post('/comics', data);
export const updateComic = (id, data) => api.put(`/comics/${id}`, data);
export const deleteComic = (id) => api.delete(`/comics/${id}`);
export const getMyComics = () => api.get('/comics/my');
export const getComicStats = (id) => api.get(`/comics/${id}/stats`);
