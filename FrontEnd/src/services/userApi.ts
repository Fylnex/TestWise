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
  role: "admin" | "student" | "teacher";
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  is_archived: boolean;
}

export const userApi = {
  getAllUsers: async (filters?: {
    search?: string;
    role?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<User[]> => {
    const response = await http.get<User[]>("/users", { params: filters });
    return response.data;
  },

  createUser: async (userData: {
    username: string;
    full_name: string;
    password: string;
    role: string;
    isActive?: boolean;
  }): Promise<User> => {
    const response = await http.post<User>("/users", userData);
    return response.data;
  },

  updateUser: async (
    id: number,
    userData: {
      full_name?: string;
      last_login?: string;
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
    isActive: boolean,
  ): Promise<User[]> => {
    const response = await http.put<User[]>("/users/bulk/status", {
      userIds,
      isActive,
    });
    return response.data;
  },

  exportUsers: async (filters?: {
    search?: string;
    role?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> => {
    const response = await http.get<ArrayBuffer>("/users/export", {
      params: filters,
      responseType: "arraybuffer",
    });
    return new Blob([response.data], { type: "text/csv" });
  },
};

export default userApi;