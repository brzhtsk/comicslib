import api from './axios.instance.js';

export const getChapters = (comicId) => api.get(`/comics/${comicId}/chapters`);
export const getChapter = (comicId, id) => api.get(`/comics/${comicId}/chapters/${id}`);
export const createChapter = (comicId, data) => api.post(`/comics/${comicId}/chapters`, data);
export const updateChapter = (comicId, id, data) => api.put(`/comics/${comicId}/chapters/${id}`, data);
export const deleteChapter = (comicId, id) => api.delete(`/comics/${comicId}/chapters/${id}`);
