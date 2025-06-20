// TestWise/src/services/sectionApi.ts
// -*- coding: utf-8 -*-
// """API для управления секциями и подсекциями в TestWise.
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
  is_archived: boolean;
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
  file_path?: string;
  type: string;
  order: number;
  created_at?: string;
  is_archived: boolean;
}

export interface SectionWithSubsections {
  id: number;
  topic_id: number;
  title: string;
  content?: string;
  description?: string;
  order: number;
  created_at?: string;
  is_archived: boolean;
  subsections: Subsection[];
}

export const sectionApi = {
  getSections: async (topicId?: number): Promise<Section[]> => {
    const response = await http.get<Section[]>("/sections", {params: {topic_id: topicId}});
    return response.data;
  },

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

  archiveSection: async (sectionId: number): Promise<void> => {
    await http.post(`/sections/${sectionId}/archive`);
  },

  restoreSection: async (sectionId: number): Promise<void> => {
    await http.post(`/sections/${sectionId}/restore`);
  },

  deleteSectionPermanently: async (sectionId: number): Promise<void> => {
    await http.delete(`/sections/${sectionId}/permanent`);
  },

  getSectionProgress: async (sectionId: number): Promise<SectionProgress> => {
    const response = await http.get<SectionProgress>(`/sections/${sectionId}/progress`);
    return response.data;
  },

  getSectionSubsections: async (sectionId: number): Promise<SectionWithSubsections> => {
    const response = await http.get<SectionWithSubsections>(`/sections/${sectionId}/subsections`);
    return response.data;
  },

  // Новые методы для подсекций
  createSubsection: async (sectionId: number, data: Partial<Subsection>): Promise<Subsection> => {
    const response = await http.post<Subsection>(`/subsections`, data);
    return response.data;
  },

  getSubsection: async (subsectionId: number): Promise<Subsection> => {
    const response = await http.get<Subsection>(`/subsections/${subsectionId}`);
    return response.data;
  },

  updateSubsection: async (subsectionId: number, data: Partial<Subsection>): Promise<Subsection> => {
    const response = await http.put<Subsection>(`/subsections/${subsectionId}`, data);
    return response.data;
  },

  archiveSubsection: async (subsectionId: number): Promise<void> => {
    await http.post(`/subsections/${subsectionId}/archive`);
  },

  restoreSubsection: async (subsectionId: number): Promise<void> => {
    await http.post(`/subsections/${subsectionId}/restore`);
  },

  deleteSubsection: async (subsectionId: number): Promise<void> => {
    await http.delete(`/subsections/${subsectionId}`);
  },

  deleteSubsectionPermanently: async (subsectionId: number): Promise<void> => {
    await http.delete(`/subsections/${subsectionId}/permanent`);
  },

  viewSubsection: async (subsectionId: number): Promise<any> => { // Замените 'any' на конкретный тип, если есть
    const response = await http.post<any>(`/subsections/${subsectionId}/view`);
    return response.data;
  },

  createSubsectionWithFile: async (formData: FormData): Promise<Subsection> => {
    const response = await http.post<Subsection>(`/subsections`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};