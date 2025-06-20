// TestWise/FrontEnd/src/services/authApi.ts
// -*- coding: utf-8 -*-
// """API для аутентификации в TestWise.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Содержит методы для входа, получения текущего пользователя
// и обновления токена через Refresh Token.
// """

import { authHttp } from "./apiConfig";
import { User } from "./userApi";

interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

interface RefreshResponse {
  access_token: string;
  refresh_token?: string;
}

export const authApi = {
  login: async (username, password): Promise<LoginResponse> => {
    const response = await authHttp.post<LoginResponse>("/auth/login", {
      username,
      password,
    });
    return response.data;
  },

  refreshToken: async (token: string): Promise<RefreshResponse> => {
    const response = await authHttp.post<RefreshResponse>(
      "/auth/refresh",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    // Этот запрос должен использовать основной 'http' экземпляр
    // чтобы перехватчик мог сработать если токен истек
    const http = (await import("./apiConfig")).default;
    const response = await http.get<User>("/users/me");
    return response.data;
  },
};