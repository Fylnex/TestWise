// TestWise/src/services/api.ts
// -*- coding: utf-8 -*-
// """Клиентский API для взаимодействия с сервером TestWise.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Содержит набор методов для работы с пользователями, темами, тестами, группами
// и прогрессом. Поддерживает авторизацию с использованием JWT-токенов и
// автоматическое обновление токенов через Refresh Token.
// """

import axios from "axios";

const API_URL = "http://localhost:8000/api/v1";

const http = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Обработчик перехвата для автоматического обновления токена
http.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshToken = localStorage.getItem("refresh_token");
          if (refreshToken) {
            const {access_token, refresh_token} = await api.refreshToken(refreshToken);
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
      }
      return config;
    },
    (error) => Promise.reject(error)
);

export interface User {
  id: number;
  username: string;
  email?: string;
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

export interface TopicProgress {
  id: number;
  user_id: number;
  topic_id: number;
  completed: boolean;
  last_updated: string;
}

export interface TestAttempt {
  id: number;
  user_id: number;
  test_id: number;
  score: number;
  completed_at: string;
}

export interface Topic {
  id: number;
  title: string;
  description?: string;
  category?: string;
  image?: string;
  created_at?: string;
  progress?: any;
}

export interface Section {
  id: number;
  topic_id: number;
  title: string;
  content?: string;
  description?: string;
  order: number;
  created_at?: string;
}

export interface Test {
  id: number;
  title: string;
  type: string;
  duration?: number;
  section_id?: number;
  topic_id?: number;
  question_ids?: number[];
  created_at?: string;
  updated_at?: string;
}

export interface Group {
  id: number;
  name: string;
  start_year: number;
  end_year: number;
  description?: string;
  created_at?: string;
}

export interface GroupStudent {
  group_id: number;
  user_id: number;
  status: "active" | "inactive";
  joined_at: string;
  left_at?: string;
}

export const api = {
  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  login: async (
      username: string,
      password: string
  ): Promise<{ access_token: string; refresh_token: string; user: User }> => {
    const response = await axios.post<
        { access_token: string; refresh_token: string; token_type: string }
    >(`${API_URL}/auth/login`, {username, password});
    const {access_token, refresh_token} = response.data;
    if (access_token && refresh_token) {
      localStorage.setItem("token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
    } else {
      throw new Error("No tokens received from login");
    }
    const userResponse = await http.get<User>("/auth/me");
    return {access_token, refresh_token, user: userResponse.data};
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await http.get<User>("/auth/me");
    return response.data;
  },

  refreshToken: async (
      refreshToken: string
  ): Promise<{ access_token: string; refresh_token: string }> => {
    const response = await axios.post<
        { access_token: string; refresh_token: string; token_type: string }
    >(`${API_URL}/auth/refresh`, {}, {headers: {Authorization: `Bearer ${refreshToken}`}});
    const {access_token, refresh_token} = response.data;
    if (access_token) {
      localStorage.setItem("token", access_token);
    }
    if (refresh_token) {
      localStorage.setItem("refresh_token", refresh_token);
    }
    return {access_token, refresh_token};
  },

  // ---------------------------------------------------------------------------
  // User Management
  // ---------------------------------------------------------------------------

  getAllUsers: async (filters?: {
    search?: string;
    role?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<User[]> => {
    const response = await http.get<User[]>("/users", {params: filters});
    return response.data;
  },

  createUser: async (userData: {
    username: string;
    email: string;
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
        username?: string;
        email?: string;
        password?: string;
        role?: string;
        isActive?: boolean;
      }
  ): Promise<User> => {
    const response = await http.put<User>(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await http.delete(`/users/${id}`);
  },

  resetPassword: async (id: number): Promise<{ message: string; new_password: string }> => {
    const response = await http.post(`/users/${id}/reset-password`);
    return response.data;
  },

  bulkUpdateRoles: async (userIds: number[], role: string): Promise<User[]> => {
    const response = await http.put<User[]>("/users/bulk/roles", {userIds, role});
    return response.data;
  },

  bulkUpdateStatus: async (userIds: number[], isActive: boolean): Promise<User[]> => {
    const response = await http.put<User[]>("/users/bulk/status", {userIds, isActive});
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
    return new Blob([response.data], {type: "text/csv"});
  },

  // ---------------------------------------------------------------------------
  // Progress Management
  // ---------------------------------------------------------------------------

  getStudentProgress: async (studentId: number): Promise<StudentProgress> => {
    const [topics, sections, subsections, testAttempts] = await Promise.all([
      api.getTopicProgressList(studentId),
      api.getSectionProgressList(studentId),
      api.getSubsectionProgressList(studentId),
      api.getTestAttempts(studentId),
    ]);

    // Агрегация данных в формат StudentProgress
    const completedTests = testAttempts.length;
    const averageScore =
        completedTests > 0
            ? Math.round(
                testAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / completedTests
            )
            : 0;
    const lastActivity =
        testAttempts.length > 0
            ? testAttempts.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0]
                .completed_at
            : new Date().toISOString();
    const testHistory = testAttempts.map((attempt) => ({
      testId: attempt.test_id,
      score: attempt.score,
      date: attempt.completed_at,
    }));

    return {
      completedTests,
      averageScore,
      lastActivity,
      testHistory,
    };
  },

  getTopicProgressList: async (userId?: number): Promise<TopicProgress[]> => {
    const response = await http.get(`/progress/topics`, {
      params: userId ? {user_id: userId} : {},
    });
    return response.data;
  },

  getSectionProgressList: async (userId?: number): Promise<any[]> => {
    const response = await http.get(`/progress/sections`, {
      params: userId ? {user_id: userId} : {},
    });
    return response.data;
  },

  getSubsectionProgressList: async (userId?: number): Promise<any[]> => {
    const response = await http.get(`/progress/subsections`, {
      params: userId ? {user_id: userId} : {},
    });
    return response.data;
  },

  getTestAttempts: async (userId?: number): Promise<TestAttempt[]> => {
    const response = await http.get(`/progress/tests`, {
      params: userId ? {user_id: userId} : {},
    });
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Topic Management
  // ---------------------------------------------------------------------------

  getTopics: async (): Promise<Topic[]> => {
    const response = await http.get<Topic[]>("/topics");
    return response.data;
  },

  getTopic: async (topicId: number): Promise<Topic> => {
    const response = await http.get<Topic>(`/topics/${topicId}`);
    return response.data;
  },

  getSectionsByTopic: async (topicId: number): Promise<Section[]> => {
    const response = await http.get<Section[]>(`/sections`, { params: { topic_id: topicId } });
    return response.data;
  },

  getTestsByTopic: async (topicId: number): Promise<Test[]> => {
    const response = await http.get<Test[]>(`/tests`, { params: { topic_id: topicId } });
    return response.data;
  },

  createTopic: async (data: Partial<Topic>): Promise<Topic> => {
    const response = await http.post<Topic>("/topics", data);
    return response.data;
  },

  createSection: async (data: Partial<Section>): Promise<Section> => {
    const response = await http.post<Section>("/sections", data);
    return response.data;
  },

  createTest: async (data: Partial<Test>): Promise<Test> => {
    const response = await http.post<Test>("/tests", data);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Group Management
  // ---------------------------------------------------------------------------

  getGroups: async (): Promise<Group[]> => {
    const response = await http.get<Group[]>("/groups");
    return response.data;
  },

  getGroup: async (groupId: number): Promise<Group> => {
    const response = await http.get<Group>(`/groups/${groupId}`);
    return response.data;
  },

  createGroup: async (data: Partial<Group>): Promise<Group> => {
    const response = await http.post<Group>("/groups", data);
    return response.data;
  },

  getGroupStudents: async (groupId: number): Promise<GroupStudent[]> => {
    const response = await http.get<{ students: GroupStudent[] }>(`/groups/${groupId}/students`);
    return response.data.students;
  },

  addGroupStudents: async (groupId: number, user_ids: number[]): Promise<GroupStudent[]> => {
    const response = await http.post<GroupStudent[]>(`/groups/${groupId}/students`, { user_ids });
    return response.data;
  },

  removeGroupStudent: async (groupId: number, userId: number): Promise<void> => {
    await http.delete(`/groups/${groupId}/students/${userId}`);
  },

  updateGroupStudentStatus: async (
      groupId: number,
      userId: number,
      status: "active" | "inactive"
  ): Promise<GroupStudent> => {
    const response = await http.put<GroupStudent>(`/groups/${groupId}/students/${userId}/status`, { status });
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Section Management
  // ---------------------------------------------------------------------------

  getSection: async (sectionId: number): Promise<any> => {
    const response = await http.get(`/sections/${sectionId}`);
    return response.data;
  },

  updateSection: async (sectionId: number, data: any): Promise<any> => {
    const response = await http.put(`/sections/${sectionId}`, data);
    return response.data;
  },

  deleteSection: async (sectionId: number): Promise<void> => {
    await http.delete(`/sections/${sectionId}`);
  },

  getSectionProgress: async (sectionId: number): Promise<any> => {
    const response = await http.get(`/sections/${sectionId}/progress`);
    return response.data;
  },

  getSectionSubsections: async (sectionId: number): Promise<any> => {
    const response = await http.get(`/sections/${sectionId}/subsections`);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Subsection Management
  // ---------------------------------------------------------------------------

  getSubsection: async (subsectionId: number): Promise<any> => {
    const response = await http.get(`/subsections/${subsectionId}`);
    return response.data;
  },

  createSubsection: async (data: any): Promise<any> => {
    const response = await http.post(`/subsections`, data);
    return response.data;
  },

  updateSubsection: async (subsectionId: number, data: any): Promise<any> => {
    const response = await http.put(`/subsections/${subsectionId}`, data);
    return response.data;
  },

  deleteSubsection: async (subsectionId: number): Promise<void> => {
    await http.delete(`/subsections/${subsectionId}`);
  },

  markSubsectionViewed: async (subsectionId: number): Promise<any> => {
    const response = await http.post(`/subsections/${subsectionId}/view`);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Question Management
  // ---------------------------------------------------------------------------

  getQuestion: async (questionId: number): Promise<any> => {
    const response = await http.get(`/questions/${questionId}`);
    return response.data;
  },

  createQuestion: async (data: any): Promise<any> => {
    const response = await http.post(`/questions`, data);
    return response.data;
  },

  updateQuestion: async (questionId: number, data: any): Promise<any> => {
    const response = await http.put(`/questions/${questionId}`, data);
    return response.data;
  },

  deleteQuestion: async (questionId: number): Promise<void> => {
    await http.delete(`/questions/${questionId}`);
  },

  // ---------------------------------------------------------------------------
  // Test Management
  // ---------------------------------------------------------------------------

  getTest: async (testId: number): Promise<any> => {
    const response = await http.get(`/tests/${testId}`);
    return response.data;
  },

  updateTest: async (testId: number, data: any): Promise<any> => {
    const response = await http.put(`/tests/${testId}`, data);
    return response.data;
  },

  deleteTest: async (testId: number): Promise<void> => {
    await http.delete(`/tests/${testId}`);
  },

  startTest: async (testId: number): Promise<any> => {
    const response = await http.post(`/tests/${testId}/start`);
    return response.data;
  },

  submitTest: async (testId: number, data: any): Promise<any> => {
    const response = await http.post(`/tests/${testId}/submit`, data);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Profile Management
  // ---------------------------------------------------------------------------

  getProfile: async (): Promise<any> => {
    const response = await http.get(`/profile`);
    return response.data;
  },
};