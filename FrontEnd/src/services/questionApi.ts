import http from "./apiConfig";
import { Question, CreateQuestionData, UpdateQuestionData } from "@/types/test";

const validateCorrectAnswer = (question_type: string, correct_answer: number | number[] | string): void => {
  switch (question_type) {
    case 'single_choice':
      if (typeof correct_answer !== 'number') {
        throw new Error('For single_choice questions, correct_answer must be a number (index)');
      }
      break;
    case 'multiple_choice':
      if (!Array.isArray(correct_answer) || !correct_answer.every(item => typeof item === 'number')) {
        throw new Error('For multiple_choice questions, correct_answer must be an array of numbers (indices)');
      }
      break;
    case 'open_text':
      if (typeof correct_answer !== 'string') {
        throw new Error('For open_text questions, correct_answer must be a string');
      }
      break;
    default:
      throw new Error(`Unsupported question_type: ${question_type}`);
  }
};

export const questionApi = {
  createQuestion: async (data: CreateQuestionData): Promise<Question> => {
    // Валидация correct_answer и question_type
    validateCorrectAnswer(data.question_type, data.correct_answer);

    const response = await http.post<Question>("/questions", data);
    return response.data;
  },

  getQuestionsByTest: async (testId: number): Promise<Question[]> => {
    const response = await http.get<Question[]>("/questions", {
      params: { test_id: testId },
    });
    return response.data;
  },

  getQuestion: async (id: number): Promise<Question> => {
    const response = await http.get<Question>(`/questions/${id}`);
    return response.data;
  },

  updateQuestion: async (
    id: number,
    data: UpdateQuestionData,
  ): Promise<Question> => {
    // Валидация correct_answer и question_type, если они предоставлены
    if (data.question_type && data.correct_answer !== undefined) {
      validateCorrectAnswer(data.question_type, data.correct_answer);
    }

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
};