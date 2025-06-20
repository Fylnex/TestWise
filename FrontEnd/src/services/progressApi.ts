// TestWise/src/services/progressApi.ts
// -*- coding: utf-8 -*-
// """API для управления прогрессом пользователей в TestWise.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Содержит методы для получения прогресса по темам, секциям, подсекциям
// и истории тестов, а также агрегацию данных для StudentProgress.
// """

import http from "./apiConfig";

export interface StudentProgress {
  completedTests: number;
  averageScore: number;
  lastActivity: string;
  testHistory: {
    testId: number;
    score: number;
    date: string;
  }[];
}

export interface TopicProgress {
  id: number;
  user_id: number;
  topic_id: number;
  status: string;
  completion_percentage: number;
  last_accessed: string;
  created_at: string;
  updated_at: string;
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

export interface SubsectionProgress {
  id: number;
  user_id: number;
  subsection_id: number;
  is_viewed: boolean;
  viewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TestAttempt {
  id: number;
  user_id: number;
  test_id: number;
  attempt_number: number;
  score: number | null;
  time_spent?: number;
  answers?: any;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const progressApi = {
  getStudentProgress: async (studentId: number): Promise<StudentProgress> => {
    const testAttempts = await progressApi.getTestAttempts(studentId);

    const completedTests = testAttempts.filter((attempt) => attempt.completed_at).length;
    const averageScore =
      completedTests > 0
        ? Math.round(
            testAttempts
              .filter((attempt) => attempt.score !== null)
              .reduce((sum, attempt) => sum + (attempt.score || 0), 0) / completedTests
          )
        : 0;
    const lastActivity =
      completedTests > 0
        ? testAttempts.sort(
            (a, b) => new Date(b.completed_at || "").getTime() - new Date(a.completed_at || "").getTime()
          )[0].completed_at || new Date().toISOString()
        : new Date().toISOString();
    const testHistory = testAttempts
      .filter((attempt) => attempt.completed_at)
      .map((attempt) => ({
        testId: attempt.test_id,
        score: attempt.score || 0,
        date: attempt.completed_at || new Date().toISOString(),
      }));

    return {
      completedTests,
      averageScore,
      lastActivity,
      testHistory,
    };
  },

  getTopicProgressList: async (userId?: number): Promise<TopicProgress[]> => {
    const response = await http.get<TopicProgress[]>("/progress/topics", {
      params: userId ? { user_id: userId } : {},
    });
    return response.data;
  },

  getSectionProgressList: async (userId?: number): Promise<SectionProgress[]> => {
    const response = await http.get<SectionProgress[]>("/progress/sections", {
      params: userId ? { user_id: userId } : {},
    });
    return response.data;
  },

  getSubsectionProgressList: async (userId?: number): Promise<SubsectionProgress[]> => {
    const response = await http.get<SubsectionProgress[]>("/progress/subsections", {
      params: userId ? { user_id: userId } : {},
    });
    return response.data;
  },

  getTestAttempts: async (userId?: number): Promise<TestAttempt[]> => {
    const response = await http.get<TestAttempt[]>("/progress/tests", {
      params: userId ? { user_id: userId } : {},
    });
    return response.data;
  },
};