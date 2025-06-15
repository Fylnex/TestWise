import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const http = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен к каждому запросу
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: number;
  username: string;
  role: "admin" | "student" | "teacher";
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface StudentProgress {
  completedTests: number;
  averageScore: number;
  lastActivity: string;
  testHistory: {
    testId: number;
    score: number;
    date: string;
  }[];
}

export const api = {
  login: async (username: string, password: string): Promise<{ token: string; user: User }> => {
    const response = await axios.post<{ token: string; user: User }>(`${API_URL}/login`, { username, password });
    return response.data;
  },
  getCurrentUser: async (token: string): Promise<User> => {
    const response = await axios.get<User>(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

export const userApi = {
  getAllUsers: async (filters?: {
    search?: string;
    role?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<User[]> => {
    const response = await http.get<User[]>('/users', { params: filters });
    return response.data;
  },

  createUser: async (userData: { username: string; password: string; role: string }): Promise<User> => {
    const response = await http.post<User>('/users', userData);
    return response.data;
  },

  updateUser: async (id: number, userData: { 
    username?: string; 
    password?: string; 
    role?: string;
    isActive?: boolean;
  }): Promise<User> => {
    const response = await http.put<User>(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await http.delete(`/users/${id}`);
  },

  getStudentProgress: async (studentId: number): Promise<StudentProgress> => {
    const response = await http.get<StudentProgress>(`/students/${studentId}/progress`);
    return response.data;
  },

  blockUser: async (id: number): Promise<User> => {
    const response = await http.put<User>(`/users/${id}/block`);
    return response.data;
  },

  unblockUser: async (id: number): Promise<User> => {
    const response = await http.put<User>(`/users/${id}/unblock`);
    return response.data;
  },

  resetPassword: async (id: number): Promise<void> => {
    await http.post(`/users/${id}/reset-password`);
  },

  bulkUpdateRoles: async (userIds: number[], role: string): Promise<User[]> => {
    const response = await http.put<User[]>('/users/bulk/roles', { userIds, role });
    return response.data;
  },

  bulkUpdateStatus: async (userIds: number[], isActive: boolean): Promise<User[]> => {
    const response = await http.put<User[]>('/users/bulk/status', { userIds, isActive });
    return response.data;
  },

  exportUsers: async (filters?: {
    search?: string;
    role?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> => {
    const response = await http.get<ArrayBuffer>('/users/export', {
      params: filters,
      responseType: 'arraybuffer'
    });
    return new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  },
}; 