// TestWise/src/services/testApi.ts
import http from "./apiConfig";
import { Question } from "./questionApi";

export interface Test {
  id: number;
  title: string;
  type: string;
  duration?: number;
  section_id?: number;
  topic_id?: number;
  questions?: Question[];
  // новый маркер — процент выполнения/успешности теста
  completion_percentage?: number;
  created_at?: string;
  updated_at?: string;
  is_archived: boolean;
}

export const testApi = {
  getTest: async (id: number): Promise<Test> => {
    const response = await http.get<Test>(`/tests/${id}`);
    return response.data;
  },

  getAllTests: async (): Promise<Test[]> => {
    const response = await http.get<Test[]>("/tests");
    return response.data;
  },

  createTest: async (data: Partial<Test>): Promise<Test> => {
    const response = await http.post<Test>("/tests", data);
    return response.data;
  },

  updateTest: async (id: number, data: Partial<Test>): Promise<Test> => {
    const response = await http.put<Test>(`/tests/${id}`, data);
    return response.data;
  },

  deleteTest: async (id: number): Promise<void> => {
    await http.delete(`/tests/${id}`);
  },

  startTest: async (id: number): Promise<any> => {
    const response = await http.post(`/tests/${id}/start`);
    return response.data;
  },

  submitTest: async (id: number, data: any): Promise<any> => {
    const response = await http.post(`/tests/${id}/submit`, data);
    return response.data;
  },

  getTestsByTopic: async (topicId: number): Promise<Test[]> => {
    const response = await http.get<Test[]>("/tests", { params: { topic_id: topicId } });
    return response.data;
  },

  getTestsBySection: async (sectionId: number): Promise<Test[]> => {
    const response = await http.get<Test[]>("/tests", { params: { section_id: sectionId } });
    return response.data;
  },

  archiveTest: async (id: number): Promise<void> => {
    await http.post(`/tests/${id}/archive`);
  },

  restoreTest: async (id: number): Promise<void> => {
    await http.post(`/tests/${id}/restore`);
  },

  deleteTestPermanently: async (id: number): Promise<void> => {
    await http.delete(`/tests/${id}/permanent`);
  },
};
