// TestWise/src/services/questionApi.ts
// -*- coding: utf-8 -*-
// """API для управления вопросами в TestWise.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Содержит методы для работы с вопросами, включая создание, получение,
// обновление, удаление, архивацию и восстановление.
// """

import http from "./apiConfig";

export interface Question {
  id: number;
  section_id: number;
  test_id?: number;
  question: string;
  question_type: string;
  options?: any[];
  correct_answer?: any;
  hint?: string;
  is_final: boolean;
  image?: string;
  created_at?: string;
  updated_at?: string;
  is_archived: boolean;
}

export const questionApi = {
  createQuestion: async (questionData: Partial<Question>): Promise<Question> => {
    const response = await http.post<Question>("/questions", questionData);
    return response.data;
  },

  getQuestion: async (questionId: number): Promise<Question> => {
    const response = await http.get<Question>(`/questions/${questionId}`);
    return response.data;
  },

  updateQuestion: async (questionId: number, data: Partial<Question>): Promise<Question> => {
    const response = await http.put<Question>(`/questions/${questionId}`, data);
    return response.data;
  },

  deleteQuestion: async (questionId: number): Promise<void> => {
    await http.delete(`/questions/${questionId}`);
  },

  archiveQuestion: async (questionId: number): Promise<void> => {
    await http.post(`/questions/${questionId}/archive`);
  },

  restoreQuestion: async (questionId: number): Promise<void> => {
    await http.post(`/questions/${questionId}/restore`);
  },

  deleteQuestionPermanently: async (questionId: number): Promise<void> => {
    await http.delete(`/questions/${questionId}/permanent`);
  },
};