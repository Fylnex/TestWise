// TestWise/src/services/topicApi.ts
// -*- coding: utf-8 -*-
// """API для управления темами, секциями, подсекциями и вопросами в TestWise.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Содержит методы для работы с темами, секциями, подсекциями и вопросами,
// включая создание, получение и обновление.
// """

import http from "./apiConfig";

export interface Topic {
  id: number;
  title: string;
  description?: string;
  category?: string;
  image?: string;
  created_at?: string;
  is_archived: boolean;
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

export interface Subsection {
  id: number;
  section_id: number;
  title: string;
  content?: string;
  type: string;
  order: number;
  created_at?: string;
}

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
}

export const topicApi = {
  getTopics: async (): Promise<Topic[]> => {
    const response = await http.get<Topic[]>("/api/v1/topics");
    return response.data;
  },

  getTopic: async (topicId: number): Promise<Topic> => {
    const response = await http.get<Topic>(`/api/v1/topics/${topicId}`);
    return response.data;
  },

  getSectionsByTopic: async (topicId: number): Promise<Section[]> => {
    const response = await http.get<Section[]>(`/api/v1/sections`, { params: { topic_id: topicId } });
    return response.data;
  },

  getSubsection: async (subsectionId: number): Promise<Subsection> => {
    const response = await http.get<Subsection>(`/api/v1/subsections/${subsectionId}`);
    return response.data;
  },

  createTopic: async (data: Partial<Topic>): Promise<Topic> => {
    const response = await http.post<Topic>("/api/v1/topics", data);
    return response.data;
  },

  createSection: async (data: Partial<Section>): Promise<Section> => {
    const response = await http.post<Section>("/api/v1/sections", data);
    return response.data;
  },

  createSubsection: async (data: Partial<Subsection>): Promise<Subsection> => {
    const response = await http.post<Subsection>("/api/v1/subsections", data);
    return response.data;
  },

  updateSection: async (sectionId: number, data: Partial<Section>): Promise<Section> => {
    const response = await http.put<Section>(`/api/v1/sections/${sectionId}`, data);
    return response.data;
  },

  updateSubsection: async (subsectionId: number, data: Partial<Subsection>): Promise<Subsection> => {
    const response = await http.put<Subsection>(`/api/v1/subsections/${subsectionId}`, data);
    return response.data;
  },

  deleteSection: async (sectionId: number): Promise<void> => {
    await http.delete(`/api/v1/sections/${sectionId}`);
  },

  deleteSubsection: async (subsectionId: number): Promise<void> => {
    await http.delete(`/api/v1/subsections/${subsectionId}`);
  },

  markSubsectionViewed: async (subsectionId: number): Promise<any> => {
    const response = await http.post(`/api/v1/subsections/${subsectionId}/view`);
    return response.data;
  },

  getQuestion: async (questionId: number): Promise<Question> => {
    const response = await http.get<Question>(`/api/v1/questions/${questionId}`);
    return response.data;
  },

  createQuestion: async (data: Partial<Question>): Promise<Question> => {
    const response = await http.post<Question>("/api/v1/questions", data);
    return response.data;
  },

  updateQuestion: async (questionId: number, data: Partial<Question>): Promise<Question> => {
    const response = await http.put<Question>(`/api/v1/questions/${questionId}`, data);
    return response.data;
  },

  deleteQuestion: async (questionId: number): Promise<void> => {
    await http.delete(`/api/v1/questions/${questionId}`);
  },

  // Новые методы для архивации
  archiveTopic: async (topicId: number): Promise<void> => {
    await http.post(`/api/v1/topics/${topicId}/archive`);
  },

  restoreTopic: async (topicId: number): Promise<void> => {
    await http.post(`/api/v1/topics/${topicId}/restore`);
  },

  deleteTopicPermanently: async (topicId: number): Promise<void> => {
    await http.delete(`/api/v1/topics/${topicId}/permanent`);
  },
};

export default topicApi;