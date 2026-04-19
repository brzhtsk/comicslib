import api from './axios.instance.js';

export const getCollections = () =>
  api.get('/collections');
export const setComicCollection = (data) =>
  api.post('/collections', data);
export const removeFromCollection = (comicId) =>
  api.delete(`/collections/${comicId}`);
export const getComicStatus = (comicId) =>
  api.get(`/collections/comic/${comicId}`);