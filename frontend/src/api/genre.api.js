import api from './axios.instance.js';

export const getGenres = () => api.get('/genres');
export const getTags = () => api.get('/genres/tags');
