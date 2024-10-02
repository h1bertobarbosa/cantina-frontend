import { authHeader } from '../helper/authHeader';
import { baseUrl } from '../helper/api';

export const apiService = {
  get(endpoint) {
    return fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: authHeader()
    });
  },
  post(endpoint, data) {
    return fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify(data)
    });
  },
  put(endpoint, data) {
    return fetch(`${baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: authHeader(),
      body: JSON.stringify(data)
    });
  },
  delete(endpoint) {
    return fetch(`${baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: authHeader()
    });
  },
  patch(endpoint, data) {
    return fetch(`${baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: authHeader(),
      body: JSON.stringify(data)
    });
  }
};
