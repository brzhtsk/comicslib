import api from './axios.instance.js';

export const getComments        = (comicId, params) => api.get(`/comics/${comicId}/comments`, { params });
export const createComment      = (comicId, data)   => api.post(`/comics/${comicId}/comments`, data);
export const updateComment      = (comicId, id, data) => api.put(`/comics/${comicId}/comments/${id}`, data);
export const deleteComment      = (comicId, id)     => api.delete(`/comics/${comicId}/comments/${id}`);
export const toggleCommentLike  = (comicId, id)     => api.post(`/comics/${comicId}/comments/${id}/like`);