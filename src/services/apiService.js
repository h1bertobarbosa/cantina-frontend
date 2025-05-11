// src/services/apiService.js
import { authHeader } from "../helper/authHeader";
import { baseUrl } from "../helper/api";
import store from "../store";

async function fetchWithLoading(url, options) {
  store.dispatch("startLoading");
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    return Promise.reject(error);
  } finally {
    store.dispatch("stopLoading");
  }
}

export const apiService = {
  get(endpoint) {
    return fetchWithLoading(`${baseUrl}${endpoint}`, {
      method: "GET",
      headers: authHeader(),
    });
  },
  post(endpoint, data) {
    return fetchWithLoading(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        ...authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },
  put(endpoint, data) {
    return fetchWithLoading(`${baseUrl}${endpoint}`, {
      method: "PUT",
      headers: {
        ...authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },
  delete(endpoint, data) {
    return fetchWithLoading(`${baseUrl}${endpoint}`, {
      method: "DELETE",
      headers: {
        ...authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },
  patch(endpoint, data) {
    return fetchWithLoading(`${baseUrl}${endpoint}`, {
      method: "PATCH",
      headers: {
        ...authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },
};
