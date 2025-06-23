// TestWise/src/services/groupApi.ts
// -*- coding: utf-8 -*-
// """API для управления группами и студентами в группах в TestWise.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Содержит методы для работы с группами, включая создание, получение,
// добавление студентов, учителей и управление их статусом.
// """

import http from "./apiConfig";

export interface Group {
  id: number;
  name: string;
  start_year: number;
  end_year: number;
  description?: string;
  created_at?: string;
  is_archived: boolean;
  demo_students?: { id: number; full_name: string; patronymic: string; username: string }[];
  demo_teacher?: { id: number; full_name: string; patronymic: string; username: string };
}

export interface GroupStudent {
  group_id: number;
  user_id: number;
  status: "active" | "inactive";
  joined_at: string;
  left_at?: string;
  is_archived: boolean;
}

export interface GroupTeacher {
  group_id: number;
  user_id: number;
  is_archived: boolean;
}

export const groupApi = {
  getGroups: async (): Promise<Group[]> => {
    const response = await http.get<Group[]>("/groups");
    return response.data;
  },

  getGroup: async (groupId: number): Promise<Group> => {
    const response = await http.get<Group>(`/groups/${groupId}`);
    return response.data;
  },

  createGroup: async (data: Partial<Group>): Promise<Group> => {
    const response = await http.post<Group>("/groups", data);
    return response.data;
  },

  updateGroup: async (groupId: number, data: Partial<Group>): Promise<Group> => {
    const response = await http.put<Group>(`/groups/${groupId}`, data);
    return response.data;
  },

  archiveGroup: async (groupId: number): Promise<void> => {
    await http.post(`/groups/${groupId}/archive`);
  },

  restoreGroup: async (groupId: number): Promise<void> => {
    await http.post(`/groups/${groupId}/restore`);
  },

  deleteGroupPermanently: async (groupId: number): Promise<void> => {
    await http.delete(`/groups/${groupId}/permanent`);
  },

  getGroupStudents: async (groupId: number): Promise<GroupStudent[]> => {
    const response = await http.get<{ students: GroupStudent[] }>(`/groups/${groupId}/students`);
    return response.data.students;
  },

  addGroupStudents: async (groupId: number, user_ids: number[]): Promise<GroupStudent[]> => {
    const response = await http.post<GroupStudent[]>(`/groups/${groupId}/students`, { user_ids });
    return response.data;
  },

  removeGroupStudent: async (groupId: number, userId: number): Promise<void> => {
    await http.delete(`/groups/${groupId}/students/${userId}`);
  },

  updateGroupStudentStatus: async (
    groupId: number,
    userId: number,
    status: "active" | "inactive"
  ): Promise<GroupStudent> => {
    const response = await http.put<GroupStudent>(`/groups/${groupId}/students/${userId}/status`, { status });
    return response.data;
  },

  addGroupTeachers: async (groupId: number, user_ids: number[]): Promise<GroupTeacher[]> => {
    const response = await http.post<GroupTeacher[]>(`/groups/${groupId}/teachers`, { user_ids });
    return response.data;
  },

  getGroupTeachers: async (groupId: number): Promise<GroupTeacher[]> => {
    const response = await http.get<GroupTeacher[]>(`/groups/${groupId}/teachers`);
    return response.data;
  },

  removeGroupTeacher: async (groupId: number, userId: number): Promise<void> => {
    await http.delete(`/groups/${groupId}/teachers/${userId}`);
  },

  getMyGroups: async (): Promise<Group[]> => {
    const response = await http.get<Group[]>("/profile/my-groups"); // Обновлённый путь
    return response.data;
  },
};