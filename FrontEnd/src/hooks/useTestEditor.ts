import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { testApi } from '@/services/testApi';
import { questionApi } from '@/services/questionApi';
import { Test, TestFormData } from '@/types/test';
import { QuestionForm, createEmptyQuestion } from '@/utils/questionUtils';
import { prepareTestCreationData, getTestRedirectPath, validateTestForm } from '@/utils/testUtils';

export const useTestEditor = () => {
  const { testId, topicId, sectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditing = Boolean(testId);

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<TestFormData>({
    title: '',
    description: '',
    type: 'hinted',
    duration: '10',
    max_attempts: '',
    completion_percentage: '80',
    target_questions: '10',
  });

  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);

  // Загрузка данных теста при редактировании
  useEffect(() => {
    if (!isEditing) {
      setLoading(false);
      return;
    }

    const loadTest = async () => {
      try {
        setLoading(true);
        const testData = await testApi.getTest(Number(testId));

        setTest(testData);
        setFormData({
          title: testData.title,
          description: testData.description || '',
          type: testData.type,
          duration: testData.duration?.toString() || '10',
          max_attempts: testData.max_attempts?.toString() || '',
          completion_percentage: testData.completion_percentage?.toString() || '80',
          target_questions: testData.target_questions?.toString() || '10',
        });

        // Загружаем вопросы из отдельного эндпоинта для получения правильных ответов
        try {
          const loadedQuestions = await questionApi.getQuestionsByTest(Number(testId));
          console.log('Loaded questions with correct answers:', loadedQuestions);
          
          // Импортируем функции один раз
          const { convertCorrectAnswerToIndex, convertMultipleChoiceCorrectAnswerToIndices } = await import('@/utils/questionUtils');
          
          const questionForms: QuestionForm[] = loadedQuestions
            .sort((a, b) => a.id - b.id) // Сортируем по возрастанию id
            .map(q => {
            // Преобразуем строковый correct_answer в индекс
            let correctAnswer: number | number[] | string;
            
            if (q.question_type === 'open_text') {
              correctAnswer = q.correct_answer || '';
            } else if (q.question_type === 'multiple_choice') {
              // Для множественного выбора преобразуем строку в массив индексов
              correctAnswer = convertMultipleChoiceCorrectAnswerToIndices(q.correct_answer, q.options || []);
              console.log(`Question ${q.id} (multiple_choice): correct_answer="${q.correct_answer}" -> indices=${JSON.stringify(correctAnswer)}`);
            } else {
              // Для одиночного выбора находим индекс правильного ответа
              correctAnswer = convertCorrectAnswerToIndex(q.correct_answer, q.options || []);
              console.log(`Question ${q.id} (single_choice): correct_answer="${q.correct_answer}" -> index=${correctAnswer}`);
            }
            
            return {
              id: q.id,
              text: q.question,
              question_type: q.question_type,
              options: q.options,
              correct_answer: correctAnswer,
              hint: q.hint,
              isNew: false
            };
          });
          setQuestions(questionForms.length > 0 ? questionForms : [createEmptyQuestion()]);
        } catch (error) {
          console.error('Error loading questions:', error);
          setQuestions([createEmptyQuestion()]);
        }
      } catch (err) {
        setError('Ошибка загрузки теста');
        console.error('Error loading test:', err);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить тест",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId, isEditing, toast]);

  const handleSave = async () => {
    // Защита от двойного нажатия
    if (saving) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);

      // Валидация формы
      const validationErrors = validateTestForm(formData);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        toast({
          title: "Ошибка валидации",
          description: validationErrors.join(', '),
          variant: "destructive",
        });
        return;
      }

      if (isEditing && testId) {
        // Обновляем существующий тест
        const updateData = {
          title: formData.title,
          description: formData.description || null,
          type: formData.type,
          duration: formData.duration ? Number(formData.duration) : null,
          max_attempts: formData.max_attempts ? Number(formData.max_attempts) : undefined,
          completion_percentage: formData.completion_percentage ? Number(formData.completion_percentage) : undefined,
          target_questions: formData.target_questions ? Number(formData.target_questions) : undefined,
        };

        await testApi.updateTest(Number(testId), updateData);

        // Обрабатываем вопросы
        const { convertIndexToCorrectAnswer } = await import('@/utils/questionUtils');
        const promises = questions.map(async (q) => {
          // Преобразуем индекс обратно в строку для сохранения
          let correctAnswerForSave: string | number | number[];
          
          if (q.question_type === 'multiple_choice') {
            // Для множественного выбора берем первый элемент массива (так как бэкенд ожидает одну строку)
            const indices = Array.isArray(q.correct_answer) ? q.correct_answer : [];
            correctAnswerForSave = indices.length > 0 && q.options ? q.options[indices[0]] : '';
          } else {
            correctAnswerForSave = convertIndexToCorrectAnswer(q.correct_answer, q.options || []);
          }
          
          if (q.isDeleted && q.id) {
            return questionApi.deleteQuestion(q.id);
          } else if (q.isNew || !q.id) {
            return questionApi.createQuestion({
              test_id: Number(testId),
              question: q.text,
              question_type: q.question_type,
              options: q.options,
              correct_answer: correctAnswerForSave,
              hint: q.hint,
              is_final: formData.type === 'section_final' || formData.type === 'global_final',
            });
          } else {
            return questionApi.updateQuestion(q.id, {
              question: q.text,
              question_type: q.question_type,
              options: q.options,
              correct_answer: correctAnswerForSave,
              hint: q.hint,
              is_final: formData.type === 'section_final' || formData.type === 'global_final',
            });
          }
        });

        await Promise.all(promises);
        toast({
          title: "Успешно",
          description: "Тест обновлен",
        });
      } else {
        // Создаем новый тест с правильной логикой передачи section_id и topic_id
        const testData = await testApi.createTest(
          prepareTestCreationData(formData, sectionId, topicId)
        );

        // Создаем вопросы последовательно, чтобы избежать проблем с параллельным созданием
        const { convertIndexToCorrectAnswer } = await import('@/utils/questionUtils');
        for (const q of questions) {
          // Преобразуем индекс обратно в строку для сохранения
          let correctAnswerForSave: string | number | number[];
          
          if (q.question_type === 'multiple_choice') {
            // Для множественного выбора берем первый элемент массива (так как бэкенд ожидает одну строку)
            const indices = Array.isArray(q.correct_answer) ? q.correct_answer : [];
            correctAnswerForSave = indices.length > 0 && q.options ? q.options[indices[0]] : '';
          } else {
            correctAnswerForSave = convertIndexToCorrectAnswer(q.correct_answer, q.options || []);
          }
          
          await questionApi.createQuestion({
            test_id: testData.id,
            question: q.text,
            question_type: q.question_type,
            options: q.options,
            correct_answer: correctAnswerForSave,
            hint: q.hint,
            is_final: formData.type === 'section_final' || formData.type === 'global_final',
          });
        }

        toast({
          title: "Успешно",
          description: "Тест создан",
        });
      }

      // Перенаправляем обратно
      navigate(getTestRedirectPath(topicId, sectionId));
    } catch (err) {
      setError('Ошибка сохранения теста');
      console.error('Error saving test:', err);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить тест",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    test,
    loading,
    saving,
    error,
    formData,
    setFormData,
    questions,
    setQuestions,
    editingQuestion,
    setEditingQuestion,
    isEditing,
    handleSave,
  };
};
