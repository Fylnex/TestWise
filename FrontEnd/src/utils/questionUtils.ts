/**
 * Утилитарные функции для работы с вопросами и правильными ответами
 */

export interface QuestionForm {
  id?: number;
  text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'open_text';
  options?: string[];
  correct_answer: number | number[] | string;
  hint?: string;
  image?: string;
  image_file?: File;
  isNew?: boolean;
  isDeleted?: boolean;
}

/**
 * Преобразует строковый correct_answer в индекс для frontend
 */
export const convertCorrectAnswerToIndex = (
  correctAnswer: string | number | number[], 
  options: string[]
): number | number[] | string => {
  if (typeof correctAnswer === 'string' && options && options.length > 0) {
    const index = options.findIndex(option => option === correctAnswer);
    return index >= 0 ? index : 0;
  }
  return correctAnswer;
};

/**
 * Преобразует массив строк correct_answer в массив индексов для multiple_choice
 */
export const convertMultipleChoiceCorrectAnswerToIndices = (
  correctAnswer: string | number | number[], 
  options: string[]
): number[] => {
  if (typeof correctAnswer === 'string' && options && options.length > 0) {
    const index = options.findIndex(option => option === correctAnswer);
    return index >= 0 ? [index] : [];
  } else if (Array.isArray(correctAnswer)) {
    return correctAnswer;
  }
  return [];
};

/**
 * Преобразует индекс обратно в строку для сохранения на бэкенд
 */
export const convertIndexToCorrectAnswer = (
  index: number | number[] | string, 
  options: string[]
): string | number | number[] => {
  if (typeof index === 'number' && options && options[index]) {
    return options[index];
  }
  return index;
};

/**
 * Преобразует массив индексов обратно в массив строк для multiple_choice
 */
export const convertIndicesToMultipleChoiceCorrectAnswer = (
  indices: number | number[] | string, 
  options: string[]
): string[] => {
  if (Array.isArray(indices)) {
    return indices.map(index => options[index] || '').filter(Boolean);
  }
  return [];
};

/**
 * Создает пустой вопрос для добавления
 */
export const createEmptyQuestion = (): QuestionForm => ({
  text: '',
  question_type: 'single_choice',
  options: ['', ''],
  correct_answer: 0,
  hint: '',
  isNew: true
});

/**
 * Валидирует правильный ответ в зависимости от типа вопроса
 */
export const validateCorrectAnswer = (
  questionType: string, 
  correctAnswer: number | number[] | string
): boolean => {
  switch (questionType) {
    case 'single_choice':
      return typeof correctAnswer === 'number';
    case 'multiple_choice':
      return Array.isArray(correctAnswer) && correctAnswer.every(item => typeof item === 'number');
    case 'open_text':
      return typeof correctAnswer === 'string';
    default:
      return false;
  }
};
