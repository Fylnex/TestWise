// TestWise/src/services/authApi.ts
// -*- coding: utf-8 -*-
// """API для аутентификации в TestWise.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Содержит методы для входа, получения текущего пользователя
// и обновления токена через Refresh Token.
// """

import http from "./apiConfig";
import { User } from "./userApi";

export const authApi = {
  login: async (
    username: string,
    password: string
  ): Promise<{ access_token: string; refresh_token: string; user: User }> => {
    const response = await http.post<
      { access_token: string; refresh_token: string; token_type: string }
    >("/auth/login", { username, password });
    const { access_token, refresh_token } = response.data;
    if (access_token && refresh_token) {
      localStorage.setItem("token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
    } else {
      throw new Error("No tokens received from login");
    }
    const userResponse = await http.get<User>("/auth/me");
    return { access_token, refresh_token, user: userResponse.data };
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await http.get<User>("/auth/me");
    return response.data;
  },

  refreshToken: async (
    refreshToken: string
  ): Promise<{ access_token: string; refresh_token: string }> => {
    const response = await http.post<
      { access_token: string; refresh_token: string; token_type: string }
    >("/auth/refresh", {}, { headers: { Authorization: `Bearer ${refreshToken}` } });
    const { access_token, refresh_token } = response.data;
    if (access_token) {
      localStorage.setItem("token", access_token);
    }
    if (refresh_token) {
      localStorage.setItem("refresh_token", refresh_token);
    }
    return { access_token, refresh_token };
  },
};