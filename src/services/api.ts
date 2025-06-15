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
  role: "admin" | "student";
  avatar?: string;
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
  getAllUsers: async (): Promise<User[]> => {
    const response = await http.get<User[]>('/users');
    return response.data;
  },

  createUser: async (userData: { username: string; password: string; role: string }): Promise<User> => {
    const response = await http.post<User>('/users', userData);
    return response.data;
  },

  updateUser: async (id: number, userData: { username: string; password?: string; role: string }): Promise<User> => {
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
}; 