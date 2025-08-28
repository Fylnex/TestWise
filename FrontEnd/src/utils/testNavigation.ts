import { useAuth } from '@/context/AuthContext';

export interface TestNavigationConfig {
  canTakeTest: boolean;
  canEditTest: boolean;
  canViewTest: boolean;
  defaultAction: 'take' | 'edit' | 'view';
  redirectPath: string;
}

export const useTestNavigation = (testId: number, topicId?: string, sectionId?: string): TestNavigationConfig => {
  const { user } = useAuth();
  
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isAdminOrTeacher = isAdmin || isTeacher;

  // Студенты могут проходить тесты
  const canTakeTest = isStudent;
  
  // Администраторы и преподаватели могут редактировать тесты
  const canEditTest = isAdminOrTeacher;
  
  // Все могут просматривать тесты
  const canViewTest = true;

  // Определяем действие по умолчанию
  let defaultAction: 'take' | 'edit' | 'view' = 'view';
  if (canTakeTest) {
    defaultAction = 'take';
  } else if (canEditTest) {
    defaultAction = 'edit';
  }

  // Формируем путь для перенаправления
  let redirectPath = '';
  if (defaultAction === 'take') {
    if (topicId && sectionId) {
      redirectPath = `/topic/${topicId}/section/${sectionId}/test/${testId}`;
    } else if (topicId) {
      redirectPath = `/topic/${topicId}/test/${testId}`;
    } else {
      redirectPath = `/test/${testId}`;
    }
  } else if (defaultAction === 'edit') {
    if (topicId && sectionId) {
      redirectPath = `/topic/${topicId}/section/${sectionId}/test/${testId}/edit`;
    } else if (topicId) {
      redirectPath = `/topic/${topicId}/test/${testId}/edit`;
    } else {
      redirectPath = `/test/${testId}/edit`;
    }
  } else {
    if (topicId && sectionId) {
      redirectPath = `/topic/${topicId}/section/${sectionId}/test/${testId}/preview`;
    } else if (topicId) {
      redirectPath = `/topic/${topicId}/test/${testId}/preview`;
    } else {
      redirectPath = `/test/${testId}/preview`;
    }
  }

  return {
    canTakeTest,
    canEditTest,
    canViewTest,
    defaultAction,
    redirectPath,
  };
};

export const getTestActionPath = (
  action: 'take' | 'edit' | 'view' | 'preview',
  testId: number,
  topicId?: string,
  sectionId?: string
): string => {
  if (action === 'take') {
    if (topicId && sectionId) {
      return `/topic/${topicId}/section/${sectionId}/test/${testId}`;
    } else if (topicId) {
      return `/topic/${topicId}/test/${testId}`;
    } else {
      return `/test/${testId}`;
    }
  } else if (action === 'edit') {
    if (topicId && sectionId) {
      return `/topic/${topicId}/section/${sectionId}/test/${testId}/edit`;
    } else if (topicId) {
      return `/topic/${topicId}/test/${testId}/edit`;
    } else {
      return `/test/${testId}/edit`;
    }
  } else {
    if (topicId && sectionId) {
      return `/topic/${topicId}/section/${sectionId}/test/${testId}/preview`;
    } else if (topicId) {
      return `/topic/${topicId}/test/${testId}/preview`;
    } else {
      return `/test/${testId}/preview`;
    }
  }
};
