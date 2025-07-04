// TestWise/src/services/topicApi.ts
// -*- coding: utf-8 -*-
// """API для управления темами в TestWise.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Содержит методы для работы с темами, включая создание, получение,
// обновление и архивацию.
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
  creator_full_name: string;
}
export interface Section {
  id: number;
  topic_id: number;
  title: string;
  content?: string;
  description?: string;
  order: number;
  created_at?: string;
  tests?: any[];
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

export interface MyTopicsResponse {
  topics: Topic[];
}

export const topicApi = {
  getTopics: async (): Promise<Topic[]> => {
    const response = await http.get<Topic[]>("/topics");
    return response.data;
  },

  getTopic: async (topicId: number): Promise<Topic> => {
    const response = await http.get<Topic>(`/topics/${topicId}`);
    return response.data;
  },

  getMyTopics: async (): Promise<Topic[]> => {  // Изменяем тип на Promise<Topic[]>
    const response = await http.get<MyTopicsResponse>("/profile/my-topics");
    return response.data.topics;  // Извлекаем массив topics
  },

  getSectionsByTopic: async (topicId: number): Promise<Section[]> => {
    const response = await http.get<Section[]>(`/sections`, { params: { topic_id: topicId } });
    return response.data;
  },

  getSubsection: async (subsectionId: number): Promise<Subsection> => {
    const response = await http.get<Subsection>(`/subsections/${subsectionId}`);
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

  createSubsection: async (data: Partial<Subsection>): Promise<Subsection> => {
    const response = await http.post<Subsection>("/subsections", data);
    return response.data;
  },

  updateSection: async (sectionId: number, data: Partial<Section>): Promise<Section> => {
    const response = await http.put<Section>(`/sections/${sectionId}`, data);
    return response.data;
  },

  updateSubsection: async (subsectionId: number, data: Partial<Subsection>): Promise<Subsection> => {
    const response = await http.put<Subsection>(`/subsections/${subsectionId}`, data);
    return response.data;
  },

  deleteSection: async (sectionId: number): Promise<void> => {
    await http.delete(`/sections/${sectionId}`);
  },

  deleteSubsection: async (subsectionId: number): Promise<void> => {
    await http.delete(`/subsections/${subsectionId}`);
  },

  markSubsectionViewed: async (subsectionId: number): Promise<any> => {
    const response = await http.post(`/subsections/${subsectionId}/view`);
    return response.data;
  },

  getQuestion: async (questionId: number): Promise<Question> => {
    const response = await http.get<Question>(`/questions/${questionId}`);
    return response.data;
  },

  createQuestion: async (data: Partial<Question>): Promise<Question> => {
    const response = await http.post<Question>("/questions", data);
    return response.data;
  },

  updateQuestion: async (questionId: number, data: Partial<Question>): Promise<Question> => {
    const response = await http.put<Question>(`/questions/${questionId}`, data);
    return response.data;
  },

  deleteQuestion: async (questionId: number): Promise<void> => {
    await http.delete(`/questions/${questionId}`);
  },

  // Новые методы для архивации
  archiveTopic: async (topicId: number): Promise<void> => {
    await http.post(`/topics/${topicId}/archive`);
  },

  restoreTopic: async (topicId: number): Promise<void> => {
    await http.post(`/topics/${topicId}/restore`);
  },

  deleteTopicPermanently: async (topicId: number): Promise<void> => {
    await http.delete(`/topics/${topicId}/permanent`);
  },
};

export default topicApi;