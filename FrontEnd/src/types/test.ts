/**
 * Типы для работы с тестами
 */

export interface Test {
  id: number;
  title: string;
  type: string;
  duration?: number;
  section_id?: number;
  topic_id?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
  is_archived: boolean;
  last_score?: number;
  questions?: Question[];
  max_attempts?: number;
  completion_percentage?: number;
  target_questions?: number;
}

export interface CreateTestData {
  title: string;
  description?: string;
  type: string;
  duration?: number;
  max_attempts?: number;
  completion_percentage?: number;
  target_questions?: number;
  section_id?: number;
  topic_id?: number;
}

export interface UpdateTestData {
  title?: string;
  description?: string;
  type?: string;
  duration?: number;
  max_attempts?: number;
  completion_percentage?: number;
  target_questions?: number;
  section_id?: number;
  topic_id?: number;
}

export interface TestFormData {
  title: string;
  description: string;
  type: string;
  duration: string;
  max_attempts: string;
  completion_percentage: string;
  target_questions: string;
}

export interface Question {
  id: number;
  test_id: number;
  question: string;
  question_type: 'single_choice' | 'multiple_choice' | 'open_text';
  options?: any[];
  correct_answer?: string | number | number[];
  hint?: string;
  is_final: boolean;
  image?: string;
  created_at?: string;
  updated_at?: string;
  is_archived: boolean;
}

export interface CreateQuestionData {
  test_id: number;
  question: string;
  question_type: 'single_choice' | 'multiple_choice' | 'open_text';
  options?: any[];
  correct_answer: number | number[] | string;
  hint?: string;
  is_final?: boolean;
  image?: string;
  image_file?: File;
}

export interface UpdateQuestionData {
  question?: string;
  question_type?: 'single_choice' | 'multiple_choice' | 'open_text';
  options?: any[];
  correct_answer?: number | number[] | string;
  hint?: string;
  is_final?: boolean;
  image?: string;
  image_file?: File;
}
