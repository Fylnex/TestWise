// TestWise/src/services/testApi.ts
// -*- coding: utf-8 -*-
// """API для управления тестами в TestWise.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Содержит методы для работы с тестами, включая создание, получение,
// обновление, удаление, запуск и отправку результатов.
// """

import http from "./apiConfig";

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

export const testApi = {
  getTest: async (testId: number): Promise<Test> => {
    const response = await http.get<Test>(`/tests/${testId}`);
    return response.data;
  },

  updateTest: async (testId: number, data: Partial<Test>): Promise<Test> => {
    const response = await http.put<Test>(`/tests/${testId}`, data);
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

  getTestsByTopic: async (topicId: number): Promise<Test[]> => {
    const response = await http.get<Test[]>(`/tests`, { params: { topic_id: topicId } });
    return response.data;
  },

  createTest: async (data: Partial<Test>): Promise<Test> => {
    const response = await http.post<Test>("/tests", data);
    return response.data;
  },
};