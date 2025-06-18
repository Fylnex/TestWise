// TestWise/src/services/groupApi.ts
// -*- coding: utf-8 -*-
// """API для управления группами и студентами в группах в TestWise.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Содержит методы для работы с группами, включая создание, получение,
// добавление студентов и управление их статусом.
// """

import http from "./apiConfig";

export interface Group {
  id: number;
  name: string;
  start_year: number;
  end_year: number;
  description?: string;
  created_at?: string;
}

export interface GroupStudent {
  group_id: number;
  user_id: number;
  status: "active" | "inactive";
  joined_at: string;
  left_at?: string;
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
};