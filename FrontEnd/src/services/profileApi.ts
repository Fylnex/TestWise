// TestWise/src/services/profileApi.ts
// -*- coding: utf-8 -*-
// """API для управления профилем пользователя в TestWise.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Содержит методы для получения данных профиля.
// """

import http from "./apiConfig";

export interface Profile {
  user_id: number;
  topics: any[];
  sections: any[];
  subsections: any[];
  tests: any[];
  generated_at: string;
}

export const profileApi = {
  getProfile: async (): Promise<Profile> => {
    const response = await http.get<Profile>("/api/v1/profile");
    return response.data;
  },
};