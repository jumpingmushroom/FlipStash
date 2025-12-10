import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Games API
export const gamesApi = {
  getAll: () => api.get('/games'),
  getById: (id) => api.get(`/games/${id}`),
  create: (game) => api.post('/games', game),
  update: (id, game) => api.put(`/games/${id}`, game),
  delete: (id) => api.delete(`/games/${id}`),
  searchIGDB: (query) => api.get('/games/igdb/search', { params: { query } }),
  refreshMarketValue: (id) => api.post(`/games/${id}/refresh-market-value`)
};

export default api;
