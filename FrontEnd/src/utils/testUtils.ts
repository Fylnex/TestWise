/**
 * Утилитарные функции для работы с тестами
 */

import { TestFormData } from '@/types/test';

/**
 * Определяет, нужно ли передавать section_id для данного типа теста
 */
export const shouldPassSectionId = (testType: string): boolean => {
  return testType === 'hinted' || testType === 'section_final';
};

/**
 * Определяет, нужно ли передавать topic_id для данного типа теста
 */
export const shouldPassTopicId = (testType: string): boolean => {
  return testType === 'global_final';
};

/**
 * Подготавливает данные для создания теста с правильной логикой передачи section_id и topic_id
 */
export const prepareTestCreationData = (
  formData: TestFormData,
  sectionId?: string,
  topicId?: string
) => {
  return {
    title: formData.title,
    description: formData.description || undefined,
    type: formData.type,
    duration: formData.duration ? Number(formData.duration) : undefined,
    max_attempts: formData.max_attempts ? Number(formData.max_attempts) : undefined,
    completion_percentage: formData.completion_percentage ? Number(formData.completion_percentage) : undefined,
    target_questions: formData.target_questions ? Number(formData.target_questions) : undefined,
    // Для тестов с подсказками и финальных тестов раздела передаем section_id
    section_id: shouldPassSectionId(formData.type) && sectionId 
      ? Number(sectionId) 
      : undefined,
    // Для глобальных финальных тестов передаем topic_id
    topic_id: shouldPassTopicId(formData.type) && topicId 
      ? Number(topicId) 
      : undefined,
  };
};

/**
 * Получает правильный путь для перенаправления после создания/редактирования теста
 */
export const getTestRedirectPath = (topicId?: string, sectionId?: string): string => {
  if (sectionId && topicId) {
    return `/topic/${topicId}/section/${sectionId}`;
  } else if (topicId) {
    return `/topic/${topicId}`;
  } else {
    return '/topics';
  }
};

/**
 * Валидирует данные формы теста
 */
export const validateTestForm = (formData: TestFormData): string[] => {
  const errors: string[] = [];
  
  if (!formData.title.trim()) {
    errors.push('Название теста обязательно');
  }
  
  if (formData.duration && (Number(formData.duration) <= 0 || Number(formData.duration) > 480)) {
    errors.push('Длительность должна быть от 1 до 480 минут');
  }
  
  if (formData.max_attempts && (Number(formData.max_attempts) <= 0 || Number(formData.max_attempts) > 100)) {
    errors.push('Количество попыток должно быть от 1 до 100');
  }
  
  if (formData.completion_percentage && (Number(formData.completion_percentage) <= 0 || Number(formData.completion_percentage) > 100)) {
    errors.push('Процент прохождения должен быть от 1 до 100');
  }
  
  if (formData.target_questions && Number(formData.target_questions) <= 0) {
    errors.push('Количество вопросов должно быть больше 0');
  }
  
  return errors;
};
