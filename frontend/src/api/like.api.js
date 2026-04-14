import api from './axios.instance.js';

export const getLikeStatus = (comicId, params) => api.get(`/comics/${comicId}/likes`, { params });
export const toggleLike = (comicId, data) => api.post(`/comics/${comicId}/likes`, data || {});
