import api from './axios.instance.js';

export const getCollections = () => api.get('/collections');
export const addToCollection = (data) => api.post('/collections', data);
export const removeFromCollection = (data) => api.delete('/collections', { data });
export const getComicStatus = (comicId) => api.get(`/collections/comic/${comicId}`);
