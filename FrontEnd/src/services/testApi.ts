import http from "./apiConfig";

export interface Question {
  id: number;
  test_id: number;
  question: string;
  question_type: "single_choice" | "multiple_choice" | "open_text";
  options?: string[];
  hint?: string;
  is_final: boolean;
  image?: string;
  created_at?: string;
  updated_at?: string;
  is_archived: boolean;
  correct_answer_index?: number; // Для single_choice после рандомизации (не возвращается)
  correct_answer_indices?: number[]; // Для multiple_choice после рандомизации (не возвращается)
}

export interface Test {
  id: number;
  title: string;
  description?: string;
  type: string;
  duration?: number;
  section_id?: number;
  topic_id?: number;
  questions?: Question[];
  completion_percentage?: number;
  created_at?: string;
  updated_at?: string;
  is_archived: boolean;
  max_attempts?: number;
  last_score?: number;
}

export interface TestStartResponse {
  attempt_id: number;
  test_id: number;
  questions: Question[];
  start_time: string;
  duration?: number;
  attempt_number: number;
}

export interface AttemptStatusResponse {
  attempt_id: number;
  test_id: number;
  status: "IN_PROGRESS" | "COMPLETED";
  start_time: string;
  duration: number;
  attempt_number: number;
  questions: Question[];
  completed_at?: string;
  score?: number;
}

export interface SubmitTestData {
  attempt_id: number;
  time_spent: number;
  answers: Array<{
    question_id: number;
    answer: number[] | string; // Унифицировано: [number] для single_choice, number[] для multiple_choice, [string] для open_text
  }>;
}

export interface SubmitResponse {
  id: number;
  user_id: number;
  test_id: number;
  attempt_number: number;
  score: number;
  time_spent: number;
  started_at: string;
  completed_at: string | null;
  status: string;
  correctCount: number;
  totalQuestions: number;
}

const validateAnswerType = (
  answer: number[] | string,
  question_type: string,
): void => {
  switch (question_type) {
    case "single_choice":
      if (
        !Array.isArray(answer) ||
        answer.length !== 1 ||
        typeof answer[0] !== "number"
      ) {
        throw new Error(
          "Answer for single_choice questions must be an array with a single number",
        );
      }
      break;
    case "multiple_choice":
      if (
        !Array.isArray(answer) ||
        !answer.every((item) => typeof item === "number")
      ) {
        throw new Error(
          "Answer for multiple_choice questions must be an array of numbers",
        );
      }
      break;
    case "open_text":
      if (
        !Array.isArray(answer) ||
        answer.length !== 1 ||
        typeof answer[0] !== "string"
      ) {
        throw new Error(
          "Answer for open_text questions must be an array with a single string",
        );
      }
      break;
    default:
      throw new Error(`Unsupported question_type: ${question_type}`);
  }
};

export const testApi = {
  getAllTests: async (): Promise<Test[]> => {
    const response = await http.get<Test[]>("/tests");
    return response.data.filter((t) => !t.is_archived);
  },

  createTest: async (data: Partial<Test>): Promise<Test> => {
    const response = await http.post<Test>("/tests", data);
    return response.data;
  },

  updateTest: async (id: number, data: Partial<Test>): Promise<Test> => {
    const response = await http.put<Test>(`/tests/${id}`, data);
    return response.data;
  },

  deleteTest: async (id: number): Promise<void> => {
    await http.delete(`/tests/${id}`);
  },

  getTestAttemptStatus: async (
    testId: number,
  ): Promise<AttemptStatusResponse> => {
    const response = await http.get(`/tests/${testId}/status`);
    return response.data;
  },

  startTest: async (testId: number) => {
    const response = await http.post(`/tests/${testId}/start`);
    return response.data;
  },

  getAttemptStatus: async (
    attemptId: number,
  ): Promise<AttemptStatusResponse> => {
    const response = await http.get<AttemptStatusResponse>(
      `/tests/attempt/${attemptId}/status`,
    );
    return response.data;
  },

  submitTest: async (testId: number, data: SubmitTestData) => {
    const response = await http.post(`/tests/${testId}/submit`, data);
    return response.data;
  },

  getTestsByTopic: async (topicId: number): Promise<Test[]> => {
    const response = await http.get<Test[]>("/tests", {
      params: { topic_id: topicId },
    });
    return response.data.filter((t) => !t.is_archived);
  },

  getTestsBySection: async (sectionId: number): Promise<Test[]> => {
    const response = await http.get<Test[]>("/tests", {
      params: { section_id: sectionId },
    });
    return response.data.filter((t) => !t.is_archived);
  },

  archiveTest: async (id: number): Promise<void> => {
    await http.post(`/tests/${id}/archive`);
  },

  restoreTest: async (id: number): Promise<void> => {
    await http.post(`/tests/${id}/restore`);
  },

  deleteTestPermanently: async (id: number): Promise<void> => {
    await http.delete(`/tests/${id}/permanent`);
  },
};
