// TestWise/src/services/api.ts
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

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
  status: 'active' | 'inactive';
  joined_at: string;
  left_at?: string;
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

export const topicApi = {
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
  createTopic: async (data: Partial<Topic>) => {
    const response = await http.post<Topic>("/topics", data);
    return response.data;
  },
  createSection: async (data: Partial<Section>) => {
    const response = await http.post<Section>("/sections", data);
    return response.data;
  },
  createTest: async (data: Partial<Test>) => {
    const response = await http.post<Test>("/tests", data);
    return response.data;
  },
};

export const groupApi = {
  getGroups: async (): Promise<Group[]> => {
    const response = await http.get<Group[]>("/groups");
    return response.data;
  },
  getGroup: async (groupId: number): Promise<Group> => {
    const response = await http.get<Group>(`/groups/${groupId}`);
    return response.data;
  },
  createGroup: async (data: Partial<Group>) => {
    const response = await http.post<Group>("/groups", data);
    return response.data;
  },
  getGroupStudents: async (groupId: number): Promise<GroupStudent[]> => {
    const response = await http.get<{students: GroupStudent[]}>(`/groups/${groupId}/students`);
    return response.data.students;
  },
  addGroupStudents: async (groupId: number, user_ids: number[]) => {
    const response = await http.post<GroupStudent[]>(`/groups/${groupId}/students`, { user_ids });
    return response.data;
  },
  removeGroupStudent: async (groupId: number, userId: number) => {
    await http.delete(`/groups/${groupId}/students/${userId}`);
  },
  updateGroupStudentStatus: async (groupId: number, userId: number, status: 'active' | 'inactive') => {
    const response = await http.put<GroupStudent>(`/groups/${groupId}/students/${userId}/status`, { status });
    return response.data;
  },
};

export const sectionApi = {
  getSection: async (sectionId: number) => {
    const response = await http.get(`/sections/${sectionId}`);
    return response.data;
  },
  updateSection: async (sectionId: number, data: any) => {
    const response = await http.put(`/sections/${sectionId}`, data);
    return response.data;
  },
  deleteSection: async (sectionId: number) => {
    await http.delete(`/sections/${sectionId}`);
  },
  getSectionProgress: async (sectionId: number) => {
    const response = await http.get(`/sections/${sectionId}/progress`);
    return response.data;
  },
  getSectionSubsections: async (sectionId: number) => {
    const response = await http.get(`/sections/${sectionId}/subsections`);
    return response.data;
  },
};

export const subsectionApi = {
  getSubsection: async (subsectionId: number) => {
    const response = await http.get(`/subsections/${subsectionId}`);
    return response.data;
  },
  createSubsection: async (data: any) => {
    const response = await http.post(`/subsections`, data);
    return response.data;
  },
  updateSubsection: async (subsectionId: number, data: any) => {
    const response = await http.put(`/subsections/${subsectionId}`, data);
    return response.data;
  },
  deleteSubsection: async (subsectionId: number) => {
    await http.delete(`/subsections/${subsectionId}`);
  },
  markSubsectionViewed: async (subsectionId: number) => {
    const response = await http.post(`/subsections/${subsectionId}/view`);
    return response.data;
  },
};

export const questionApi = {
  getQuestion: async (questionId: number) => {
    const response = await http.get(`/questions/${questionId}`);
    return response.data;
  },
  createQuestion: async (data: any) => {
    const response = await http.post(`/questions`, data);
    return response.data;
  },
  updateQuestion: async (questionId: number, data: any) => {
    const response = await http.put(`/questions/${questionId}`, data);
    return response.data;
  },
  deleteQuestion: async (questionId: number) => {
    await http.delete(`/questions/${questionId}`);
  },
};

export const testApi = {
  getTest: async (testId: number) => {
    const response = await http.get(`/tests/${testId}`);
    return response.data;
  },
  updateTest: async (testId: number, data: any) => {
    const response = await http.put(`/tests/${testId}`, data);
    return response.data;
  },
  deleteTest: async (testId: number) => {
    await http.delete(`/tests/${testId}`);
  },
  startTest: async (testId: number) => {
    const response = await http.post(`/tests/${testId}/start`);
    return response.data;
  },
  submitTest: async (testId: number, data: any) => {
    const response = await http.post(`/tests/${testId}/submit`, data);
    return response.data;
  },
};

export const progressApi = {
  getTopicProgressList: async (userId?: number) => {
    const response = await http.get(`/progress/topics`, { params: userId ? { user_id: userId } : {} });
    return response.data;
  },
  getSectionProgressList: async (userId?: number) => {
    const response = await http.get(`/progress/sections`, { params: userId ? { user_id: userId } : {} });
    return response.data;
  },
  getSubsectionProgressList: async (userId?: number) => {
    const response = await http.get(`/progress/subsections`, { params: userId ? { user_id: userId } : {} });
    return response.data;
  },
  getTestAttempts: async (userId?: number) => {
    const response = await http.get(`/progress/tests`, { params: userId ? { user_id: userId } : {} });
    return response.data;
  },
};

export const profileApi = {
  getProfile: async () => {
    const response = await http.get(`/profile`);
    return response.data;
  },
}; 