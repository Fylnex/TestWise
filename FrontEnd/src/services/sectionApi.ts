// TestWise/src/services/sectionApi.ts
// -*- coding: utf-8 -*-
// """API для управления секциями в TestWise.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Содержит методы для работы с секциями, включая получение,
// обновление, удаление, прогресс и подсекции.
// """

import http from "./apiConfig";

export interface Section {
  id: number;
  topic_id: number;
  title: string;
  content?: string;
  description?: string;
  order: number;
  created_at?: string;
}

export interface SectionProgress {
  id: number;
  user_id: number;
  section_id: number;
  status: string;
  completion_percentage: number;
  last_accessed: string;
  created_at: string;
  updated_at: string;
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

export interface SectionWithSubsections {
  id: number;
  topic_id: number;
  title: string;
  content?: string;
  description?: string;
  order: number;
  created_at?: string;
  subsections: Subsection[];
}

export const sectionApi = {
  getSection: async (sectionId: number): Promise<Section> => {
    const response = await http.get<Section>(`/sections/${sectionId}`);
    return response.data;
  },

  updateSection: async (sectionId: number, data: Partial<Section>): Promise<Section> => {
    const response = await http.put<Section>(`/sections/${sectionId}`, data);
    return response.data;
  },

  deleteSection: async (sectionId: number): Promise<void> => {
    await http.delete(`/sections/${sectionId}`);
  },

  getSectionProgress: async (sectionId: number): Promise<SectionProgress> => {
    const response = await http.get<SectionProgress>(`/sections/${sectionId}/progress`);
    return response.data;
  },

  getSectionSubsections: async (sectionId: number): Promise<SectionWithSubsections> => {
    const response = await http.get<SectionWithSubsections>(`/sections/${sectionId}/subsections`);
    return response.data;
  },
};