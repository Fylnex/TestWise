import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  Clock, 
  Target, 
  CheckCircle, 
  AlertCircle,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import Header from '@/components/Header';
import { testApi } from '@/services/testApi';
import { questionApi } from '@/services/questionApi';
import { Test, Question, TestFormData } from '@/types/test';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getTestTypeInRussian } from '@/lib/utils';
import QuestionEditor from '@/components/questions/QuestionEditor';
import { 
  QuestionForm, 
  convertCorrectAnswerToIndex, 
  convertMultipleChoiceCorrectAnswerToIndices,
  convertIndexToCorrectAnswer,
  createEmptyQuestion
} from '@/utils/questionUtils';
import { 
  prepareTestCreationData, 
  getTestRedirectPath, 
  validateTestForm 
} from '@/utils/testUtils';
import TestViewer from '@/components/tests/TestViewer';







const TestEditor: React.FC = () => {
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
           
           const questionForms: QuestionForm[] = loadedQuestions.map(q => {
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
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId, isEditing]);

  const handleInputChange = (field: keyof TestFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const validateQuestions = (): boolean => {
    const activeQuestions = questions.filter(q => !q.isDeleted);

    for (let i = 0; i < activeQuestions.length; i++) {
      const q = activeQuestions[i];

      if (!q.text.trim()) {
        setError(`Вопрос ${i + 1}: текст вопроса не может быть пустым`);
        return false;
      }

      switch (q.question_type) {
        case 'single_choice':
          if (!q.options || q.options.length < 2) {
            setError(`Вопрос ${i + 1}: должно быть минимум 2 варианта ответа`);
            return false;
          }
          if (q.options.some(opt => !opt.trim())) {
            setError(`Вопрос ${i + 1}: все варианты ответов должны быть заполнены`);
            return false;
          }
          if (typeof q.correct_answer !== 'number' || q.correct_answer < 0 || q.correct_answer >= q.options.length) {
            setError(`Вопрос ${i + 1}: выберите правильный ответ`);
            return false;
          }
          break;

        case 'multiple_choice':
          if (!q.options || q.options.length < 2) {
            setError(`Вопрос ${i + 1}: должно быть минимум 2 варианта ответа`);
            return false;
          }
          if (q.options.some(opt => !opt.trim())) {
            setError(`Вопрос ${i + 1}: все варианты ответов должны быть заполнены`);
            return false;
          }
          if (!Array.isArray(q.correct_answer) || q.correct_answer.length === 0) {
            setError(`Вопрос ${i + 1}: выберите хотя бы один правильный ответ`);
            return false;
          }
          break;

        case 'open_text':
          if (typeof q.correct_answer !== 'string' || !q.correct_answer.trim()) {
            setError(`Вопрос ${i + 1}: введите правильный ответ`);
            return false;
          }
          break;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateQuestions()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (isEditing && testId) {
        // Обновляем существующий тест
        const updateData = {
          title: formData.title,
          description: formData.description || null,
          type: formData.type,
          duration: formData.duration ? Number(formData.duration) : null,
          max_attempts: formData.max_attempts ? Number(formData.max_attempts) : undefined,
        };

        await testApi.updateTest(Number(testId), updateData);

        // Обрабатываем вопросы
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

        // Создаем вопросы
        await Promise.all(questions.map(q => {
          // Преобразуем индекс обратно в строку для сохранения
          let correctAnswerForSave: string | number | number[];
          
          if (q.question_type === 'multiple_choice') {
            // Для множественного выбора берем первый элемент массива (так как бэкенд ожидает одну строку)
            const indices = Array.isArray(q.correct_answer) ? q.correct_answer : [];
            correctAnswerForSave = indices.length > 0 && q.options ? q.options[indices[0]] : '';
          } else {
            correctAnswerForSave = convertIndexToCorrectAnswer(q.correct_answer, q.options || []);
          }
          
          return questionApi.createQuestion({
            test_id: testData.id,
            question: q.text,
            question_type: q.question_type,
            options: q.options,
            correct_answer: correctAnswerForSave,
            hint: q.hint,
            is_final: formData.type === 'section_final' || formData.type === 'global_final',
          });
        }));

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !test && isEditing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={() => navigate(-1)}>Назад</Button>
          </div>
        </div>
      </div>
    );
  }

  const activeQuestions = questions.filter(q => !q.isDeleted);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto py-8 max-w-6xl">
        {/* Заголовок */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => {
              if (topicId) {
                navigate(`/topic/${topicId}`);
              } else {
                navigate(-1);
              }
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
                     <div className="flex items-center justify-between w-full">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-100 rounded-lg">
                 <BookOpen className="h-6 w-6 text-blue-600" />
               </div>
               <h1 className="text-3xl font-bold text-gray-900">
                 {isEditing ? 'Редактирование теста' : 'Создание нового теста'}
               </h1>
             </div>
             <div className="text-right">
               <p className="text-gray-600">
                 {isEditing ? 'Измените параметры и вопросы теста' : 'Создайте новый тест с вопросами'}
               </p>
             </div>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Основная информация */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-blue-600" />
                Основная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-semibold">Название теста</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Введите название теста"
                    required
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="font-semibold">Тип теста</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип теста" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hinted">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          С подсказками
                        </div>
                      </SelectItem>
                      <SelectItem value="section_final">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Финальный по разделу
                        </div>
                      </SelectItem>
                      <SelectItem value="global_final">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Глобальный финальный
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration" className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Длительность (минуты)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", e.target.value)}
                    placeholder="Неограниченно"
                    min="0"
                  />
                  <p className="text-sm text-gray-500">
                    Оставьте пустым для неограниченного времени
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_attempts" className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Максимум попыток
                  </Label>
                  <Input
                    id="max_attempts"
                    type="number"
                    value={formData.max_attempts}
                    onChange={(e) => handleInputChange("max_attempts", e.target.value)}
                    placeholder={
                      formData.type === "section_final" || formData.type === "global_final"
                        ? "По умолчанию 3"
                        : "Неограниченно"
                    }
                    min="1"
                  />
                  <p className="text-sm text-gray-500">
                    {formData.type === "section_final" || formData.type === "global_final"
                      ? "Для финальных тестов по умолчанию 3 попытки"
                      : "Оставьте пустым для неограниченного количества"
                    }
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold">Описание теста</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Введите описание теста (опционально)"
                  rows={3}
                />
              </div>

              {/* Информация о тесте */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-800">Информация о тесте</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Тип:</span>
                    <Badge variant="secondary" className="ml-2">
                      {getTestTypeInRussian(formData.type)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Вопросов:</span>
                    <span className="font-semibold ml-2">{activeQuestions.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Длительность:</span>
                    <span className="font-semibold ml-2">
                      {formData.duration ? `${formData.duration} мин` : 'Неограниченно'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Попыток:</span>
                    <span className="font-semibold ml-2">
                      {formData.max_attempts || 'Неограниченно'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

                     {/* Вопросы */}
                          <QuestionEditor
                 questions={questions}
                 onQuestionsChange={setQuestions}
                 isViewMode={false}
                 showHints={formData.type === 'hinted'}
               />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-semibold">Ошибка:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (topicId) {
                  navigate(`/topic/${topicId}`);
                } else {
                  navigate(-1);
                }
              }}
              disabled={saving}
              className="px-8"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Сохранение...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {isEditing ? 'Сохранить изменения' : 'Создать тест'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestEditor;
