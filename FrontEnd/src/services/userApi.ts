// TestWise/src/services/userApi.ts
// -*- coding: utf-8 -*-
// """API для управления пользователями в TestWise.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Содержит методы для работы с пользователями, включая создание,
// обновление, удаление, сброс пароля, массовое обновление ролей и статуса,
// а также экспорт данных.
// """

import http from "./apiConfig";

export interface User {
  id: number;
  username: string;
  full_name: string;
  patronymic?: string;
  role: "admin" | "student" | "teacher";
  is_active: boolean;
  created_at: string; // Ensure this is a string in ISO format
  last_login?: string; // Ensure this is a string in ISO format
  refresh_token?: string;
  is_archived: boolean;
}

export const userApi = {
  getAllUsers: async (filters?: {
    search?: string;
    role?: string;
    is_active?: boolean;
  }): Promise<User[]> => {
    const response = await http.get<User[]>("/users", { params: filters });
    // Ensure dates are returned as ISO strings
    return response.data.map((user) => ({
      ...user,
      created_at: user.created_at ? new Date(user.created_at).toISOString() : "",
      last_login: user.last_login
        ? new Date(user.last_login).toISOString()
        : undefined,
    }));
  },

  createUser: async (userData: {
    username: string;
    full_name: string;
    password: string;
    role: string;
    is_active?: boolean;
  }): Promise<User> => {
    const response = await http.post<User>("/users", userData);
    return response.data;
  },

  updateUser: async (
    id: number,
    userData: {
      username?: string;
      full_name?: string;
      last_login?: string;
      is_active?: boolean;
      role?: string;
    },
  ): Promise<User> => {
    const response = await http.put<User>(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await http.delete(`/users/${id}`);
  },

  archiveUser: async (id: number): Promise<void> => {
    await http.post(`/users/${id}/archive`);
  },

  restoreUser: async (id: number): Promise<void> => {
    await http.post(`/users/${id}/restore`);
  },

  deleteUserPermanently: async (id: number): Promise<void> => {
    await http.delete(`/users/${id}/permanent`);
  },

  resetPassword: async (
    id: number,
  ): Promise<{ message: string; new_password: string }> => {
    const response = await http.post(`/users/${id}/reset-password`);
    return response.data;
  },

  bulkUpdateRoles: async (userIds: number[], role: string): Promise<User[]> => {
    const response = await http.put<User[]>("/users/bulk/roles", {
      userIds,
      role,
    });
    return response.data;
  },

  bulkUpdateStatus: async (
    userIds: number[],
    is_active: boolean,
  ): Promise<User[]> => {
    const response = await http.put<User[]>("/users/bulk/status", {
      userIds,
      is_active,
    });
    return response.data;
  },

  exportUsers: async (filters?: {
    search?: string;
    role?: string;
    is_active?: boolean;
  }): Promise<Blob> => {
    const response = await http.get<ArrayBuffer>("/users/export", {
      params: filters,
      responseType: "arraybuffer",
    });
    return new Blob([response.data], { type: "text/csv" });
  },
};

export default userApi;