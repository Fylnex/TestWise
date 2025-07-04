// TestWise/src/services/sectionApi.ts
// -*- coding: utf-8 -*-
// API для управления секциями и подсекциями в TestWise.

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
  tests?: any[]; // или Test[], если тип Test импортирован
}

export interface Subsection {
  id: number;
  section_id: number;
  title: string;
  content?: string;
  file_path?: string;
  type: "text" | "pdf";
  order: number;
  created_at?: string;
  is_archived: boolean;
}

export interface SectionWithSubsections extends Section {
  subsections: Subsection[];
}

// Секции
export const sectionApi = {
  getSectionsByTopic: (topicId: number) =>
    http.get<Section[]>(`/sections`, { params: { topic_id: topicId } }).then(r => r.data),

  getSection: (sectionId: number) =>
    http.get<Section>(`/sections/${sectionId}`).then(r => r.data),

  createSection: (data: Partial<Section>) =>
    http.post<Section>(`/sections`, data).then(r => r.data),

  updateSection: (id: number, data: Partial<Section>) =>
    http.put<Section>(`/sections/${id}`, data).then(r => r.data),

  deleteSection: (id: number) =>
    http.delete(`/sections/${id}`),

  archiveSection: (id: number) =>
    http.post(`/sections/${id}/archive`),

  restoreSection: (id: number) =>
    http.post(`/sections/${id}/restore`),

  deleteSectionPermanently: (id: number) =>
    http.delete(`/sections/${id}/permanent`),

  // Подсекции
  getSectionSubsections: (sectionId: number) =>
    http.get<SectionWithSubsections>(`/sections/${sectionId}/subsections`).then(r => r.data),

  // Создание TEXT‑подсекции через JSON
  createSubsectionJson: async (data: {
    section_id: number;
    title: string;
    content: string;
    type: 'text';
    order?: number;
  }): Promise<Subsection> => {
    const response = await http.post<Subsection>(`/subsections/json`, data);
    return response.data;
  },

  // Создание PDF‑подсекции через multipart/form-data
  createSubsection: (formData: FormData) =>
    http.post<Subsection>(`/subsections`, formData).then(r => r.data),

  updateSubsectionJson: (
    id: number,
    data: { title?: string; content?: string; type: "text"; order?: number }
  ) =>
    http.put<Subsection>(`/subsections/${id}/json`, data).then(r => r.data),

  updateSubsection: (id: number, formData: FormData) =>
    http.put<Subsection>(`/subsections/${id}`, formData).then(r => r.data),

  deleteSubsection: (id: number) =>
    http.delete(`/subsections/${id}`),

  archiveSubsection: (id: number) =>
    http.post(`/subsections/${id}/archive`),

  restoreSubsection: (id: number) =>
    http.post(`/subsections/${id}/restore`),

  deleteSubsectionPermanently: (id: number) =>
    http.delete(`/subsections/${id}/permanent`),

  viewSubsection: (id: number) =>
    http.post(`/subsections/${id}/view`).then(r => r.data),

  createSubsectionWithFile: async (formData: FormData): Promise<Subsection> => {
    const response = await http.post<Subsection>(`/subsections`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
