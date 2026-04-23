import api from './axios.instance.js';

export const getCollections       = ()                     => api.get('/collections');
export const createCollection     = (name)                 => api.post('/collections', { name });
export const deleteCollection     = (id)                   => api.delete(`/collections/${id}`);
export const setComicCollection   = (comicId, collectionId) => api.post('/collections/set', { comicId, collectionId });
export const getComicCollection   = (comicId)              => api.get(`/collections/comic/${comicId}`);