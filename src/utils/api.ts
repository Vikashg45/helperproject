// utils/api.js
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export const getData = async (page = 1, limit = 100, search = '') => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
  });

  const response = await axios.get(`${API_BASE}/data?${params.toString()}`);
  return response.data;
};
