// TestWise/src/services/questionApi.ts
import http from "./apiConfig";

export interface Question {
  id: number;
  test_id: number;
  question: string;
  question_type: string;
  options?: any[];
  correct_answer?: any;
  hint?: string;
  is_final: boolean;
  image?: string;
  created_at?: string;
  updated_at?: string;
  is_archived: boolean;
}

export const questionApi = {
  createQuestion: async (data: Omit<Partial<Question>, "id" | "created_at" | "updated_at" | "is_archived">): Promise<Question> => {
    const response = await http.post<Question>("/questions", data);
    return response.data;
  },

  getQuestion: async (id: number): Promise<Question> => {
    const response = await http.get<Question>(`/questions/${id}`);
    return response.data;
  },

  updateQuestion: async (id: number, data: Partial<Question>): Promise<Question> => {
    const response = await http.put<Question>(`/questions/${id}`, data);
    return response.data;
  },

  deleteQuestion: async (id: number): Promise<void> => {
    await http.delete(`/questions/${id}`);
  },

  archiveQuestion: async (id: number): Promise<void> => {
    await http.post(`/questions/${id}/archive`);
  },

  restoreQuestion: async (id: number): Promise<void> => {
    await http.post(`/questions/${id}/restore`);
  },

  deleteQuestionPermanently: async (id: number): Promise<void> => {
    await http.delete(`/questions/${id}/permanent`);
  },

  getQuestionsByTestId: async (testId: number): Promise<Question[]> => {
    const response = await http.get<Question[]>("/questions", {
      params: { test_id: testId },
    });
    return response.data;
  },
};
