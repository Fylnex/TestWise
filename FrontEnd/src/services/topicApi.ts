// TestWise/src/services/topicApi.ts
// -*- coding: utf-8 -*-
// API для управления темами и разделами в TestWise.

import http from "./apiConfig";

export interface Topic {
  id: number;
  title: string;
  description?: string;
  category?: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
  is_archived: boolean;
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
  is_archived: boolean;
}

export interface MyTopicsResponse {
  topics: Topic[];
}

export const topicApi = {
  // Темы
  getTopics: () =>
    http.get<Topic[]>(`/topics`).then(r => r.data),

  getTopic: (id: number) =>
    http.get<Topic>(`/topics/${id}`).then(r => r.data),

  getMyTopics: () =>
    http.get<MyTopicsResponse>(`/profile/my-topics`).then(r => r.data.topics),

  createTopic: (data: Partial<Topic>) =>
    http.post<Topic>(`/topics`, data).then(r => r.data),

  updateTopic: (id: number, data: Partial<Topic>) =>
    http.put<Topic>(`/topics/${id}`, data).then(r => r.data),

  deleteTopic: (id: number) =>
    http.delete(`/topics/${id}`),

  archiveTopic: (id: number) =>
    http.post(`/topics/${id}/archive`),

  restoreTopic: (id: number) =>
    http.post(`/topics/${id}/restore`),

  deleteTopicPermanently: (id: number) =>
    http.delete(`/topics/${id}/permanent`),

  // Разделы
  getSectionsByTopic: (topicId: number) =>
    http.get<Section[]>(`/sections`, { params: { topic_id: topicId } }).then(r => r.data),

  createSection: (data: Partial<Section>) =>
    http.post<Section>(`/sections`, data).then(r => r.data),

  updateSection: (id: number, data: Partial<Section>) =>
    http.put<Section>(`/sections/${id}`, data).then(r => r.data),

  deleteSection: (id: number) =>
    http.delete(`/sections/${id}`),
};
