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
  searchIGDB: (query, platform = null) => {
    const params = { query };
    if (platform && platform.trim() !== '') {
      params.platform = platform;
    }
    return api.get('/games/igdb/search', { params });
  },
  refreshMarketValue: (id) => api.post(`/games/${id}/refresh-market-value`),
  exportCSV: () => api.get('/games/export/csv', { responseType: 'blob' }),
  importCSV: (csvData, mode, defaultCurrency) => api.post('/games/import/csv', { csv: csvData, mode, defaultCurrency }),
  getAcquisitionSources: () => api.get('/games/acquisition-sources'),
  batchUpdatePostedOnline: (gameIds, postedOnline) => api.post('/games/batch/posted-online', { gameIds, postedOnline }),
  batchUpdateCondition: (gameIds, condition) => api.post('/games/batch/condition', { gameIds, condition }),
  batchDelete: (gameIds) => api.post('/games/batch/delete', { gameIds }),
  batchRefreshMarketValues: (gameIds) => api.post('/games/batch/refresh-market-values', { gameIds }),
  batchRefreshMarketValuesSSE: (gameIds, onProgress) => {
    // Use fetch API for SSE instead of axios
    return fetch(`${API_BASE_URL}/api/games/batch/refresh-market-values-sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ gameIds })
    }).then(response => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = () => {
        return reader.read().then(({ done, value }) => {
          if (done) {
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop(); // Keep incomplete line in buffer

          lines.forEach(line => {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.substring(6));
              onProgress(data);
            }
          });

          return processStream();
        });
      };

      return processStream();
    });
  },
  getPriceHistory: (gameId) => api.get(`/games/${gameId}/price-history`)
};

export default api;
