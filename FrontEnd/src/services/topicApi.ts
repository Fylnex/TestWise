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

  createTopic: async (data: Partial<Topic>): Promise<Topic> => {
    const response = await http.post<Topic>("/topics", data);
    return response.data;
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