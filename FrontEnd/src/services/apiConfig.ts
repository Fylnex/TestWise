// TestWise/src/services/apiConfig.ts
// -*- coding: utf-8 -*-
// """Конфигурация HTTP-клиента для TestWise.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Определяет общий HTTP-клиент с перехватчиками для обработки токенов
// и автоматического обновления токенов через Refresh Token.
// """

import axios from "axios";

const API_URL = "http://localhost:8000/api/v1";

export const authHttp = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const http = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Перехватчик для автоматического обновления токена
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const { data } = await authHttp.post('/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${refreshToken}` },
          });

          const { access_token, refresh_token } = data;

          localStorage.setItem("token", access_token);
          if (refresh_token) {
            localStorage.setItem("refresh_token", refresh_token);
          }
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return http(originalRequest);
        }
      } catch (refreshError) {
        console.error("Refresh token failed:", refreshError);
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Adding token to request:", token); // Для отладки
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default http;