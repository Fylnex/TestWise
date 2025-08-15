import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { testApi, Test } from '@/services/testApi';
import { questionApi, Question } from '@/services/questionApi';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';

interface QuestionForm {
  id?: number;
  text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'open_text';
  options?: string[];
  correct_answer: number | number[] | string;
  hint?: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

const emptyQuestion: QuestionForm = {
  text: '',
  question_type: 'single_choice',
  options: ['', ''],
  correct_answer: 0,
  hint: '',
  isNew: true
};

const EditTest: React.FC = () => {
  const { testId, topicId, sectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'hinted',
    duration: '',
    max_attempts: '',
  });

  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  useEffect(() => {
    if (!testId) return;
    const loadTest = async () => {
      try {
        setLoading(true);

        // Загружаем тест (без getTest, используем testApi.getAllTests и находим нужный)
        const allTests = await testApi.getAllTests();
        const testData = allTests.find(t => t.id === Number(testId));

        if (!testData) {
          throw new Error('Тест не найден');
        }

        setTest(testData);
        setFormData({
          title: testData.title,
          type: testData.type,
          duration: testData.duration?.toString() || '',
          max_attempts: testData.max_attempts?.toString() || '',
        });

        // Загружаем вопросы через новый API (поскольку getQuestionsByTestId удален,
        // используем startTest для получения вопросов)
        try {
          const testStart = await testApi.startTest(Number(testId));
          const loadedQuestions: QuestionForm[] = testStart.questions.map(q => ({
            id: q.id,
            text: q.question,
            question_type: q.question_type,
            options: q.options,
            correct_answer: q.question_type === 'single_choice' ? 0 :
                           q.question_type === 'multiple_choice' ? [] : '',
            hint: q.hint,
            isNew: false
          }));
          setQuestions(loadedQuestions);
        } catch (startError) {
          // Если startTest недоступен, начинаем с пустого списка
          setQuestions([{ ...emptyQuestion }]);
        }
      } catch (err) {
        setError('Ошибка загрузки теста');
        console.error('Error loading test:', err);
      } finally {
        setLoading(false);
      }
    };
    loadTest();
  }, [testId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuestionChange = (idx: number, field: keyof QuestionForm, value: string) => {
    setQuestions(qs => qs.map((q, i) => {
      if (i === idx) {
        const updatedQuestion = { ...q, [field]: value };

        // При смене типа вопроса сбрасываем опции и правильный ответ
        if (field === 'question_type') {
          if (value === 'open_text') {
            updatedQuestion.options = undefined;
            updatedQuestion.correct_answer = '';
          } else if (value === 'single_choice') {
            updatedQuestion.options = q.options || ['', ''];
            updatedQuestion.correct_answer = 0;
          } else if (value === 'multiple_choice') {
            updatedQuestion.options = q.options || ['', ''];
            updatedQuestion.correct_answer = [];
          }
        }

        return updatedQuestion;
      }
      return q;
    }));
  };

  const handleOptionChange = (qIdx: number, oIdx: number, value: string) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? {
      ...q,
      options: q.options?.map((o, j) => j === oIdx ? value : o)
    } : q));
  };

  const handleCorrectAnswerChange = (qIdx: number, value: number | number[] | string) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, correct_answer: value } : q));
  };

  const addQuestion = () => {
    setQuestions(qs => [...qs, { ...emptyQuestion }]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length > 1) {
      setQuestions(qs => qs.map((q, i) => {
        if (i === idx) {
          // Если это существующий вопрос, помечаем его как удаленный
          if (q.id && !q.isNew) {
            return { ...q, isDeleted: true };
          }
        }
        return q;
      }).filter((q, i) => i !== idx || (q.id && !q.isNew && q.isDeleted)));
    }
  };

  const addAnswer = (qIdx: number) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? {
      ...q,
      options: q.options ? [...q.options, ''] : ['', '']
    } : q));
  };

  const removeAnswer = (qIdx: number, aIdx: number) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? {
      ...q,
      options: q.options && q.options.length > 2 ? q.options.filter((_, j) => j !== aIdx) : q.options
    } : q));
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
    if (!testId) return;

    if (!validateQuestions()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Обновляем основную информацию о тесте
      const updateData = {
        title: formData.title,
        type: formData.type,
        duration: formData.duration ? Number(formData.duration) : null,
        max_attempts: formData.max_attempts ? Number(formData.max_attempts) : undefined,
      };

      await testApi.updateTest(Number(testId), updateData);

      // Обрабатываем вопросы
      const promises = questions.map(async (q) => {
        if (q.isDeleted && q.id) {
          // Удаляем существующий вопрос
          return questionApi.deleteQuestion(q.id);
        } else if (q.isNew || !q.id) {
          // Создаем новый вопрос
          return questionApi.createQuestion({
            test_id: Number(testId),
            question: q.text,
            question_type: q.question_type,
            options: q.options,
            correct_answer: q.correct_answer,
            hint: q.hint,
            is_final: formData.type === 'section_final' || formData.type === 'global_final',
          });
        } else {
          // Обновляем существующий вопрос
          return questionApi.updateQuestion(q.id, {
            question: q.text,
            question_type: q.question_type,
            options: q.options,
            correct_answer: q.correct_answer,
            hint: q.hint,
            is_final: formData.type === 'section_final' || formData.type === 'global_final',
          });
        }
      });

      await Promise.all(promises);

      // Перенаправляем обратно на страницу темы или секции
      if (topicId) {
        navigate(`/topic/${topicId}`);
      } else if (test?.section_id) {
        navigate(`/topic/${test.topic_id}`);
      } else if (test?.topic_id) {
        navigate(`/topic/${test.topic_id}`);
      } else {
        navigate('/topics');
      }
    } catch (err) {
      setError('Ошибка сохранения теста');
      console.error('Error updating test:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Загрузка теста...</span>
        </div>
      </Layout>
    );
  }

  if (error && !test) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={() => navigate(-1)}>Назад</Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!test) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-gray-500 mb-4">Тест не найден</div>
            <Button onClick={() => navigate(-1)}>Назад</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const activeQuestions = questions.filter(q => !q.isDeleted);

  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              if (topicId) {
                navigate(`/topic/${topicId}`);
              } else {
                navigate(-1);
              }
            }}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold">Редактирование теста</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Название теста</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Введите название теста"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Тип теста</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип теста" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hinted">С подсказками</SelectItem>
                    <SelectItem value="section_final">
                      Финальный по разделу
                    </SelectItem>
                    <SelectItem value="global_final">
                      Глобальный финальный
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Длительность (минуты)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    handleInputChange("duration", e.target.value)
                  }
                  placeholder="Оставьте пустым для неограниченного времени"
                  min="0"
                />
                <p className="text-sm text-gray-500">
                  Оставьте поле пустым, если время не ограничено
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_attempts">
                  Максимум попыток (опционально)
                </Label>
                <Input
                  id="max_attempts"
                  type="number"
                  value={
                    formData.type === "section_final" ||
                    formData.type === "global_final"
                      ? "3"
                      : formData.max_attempts || ""
                  }
                  onChange={(e) =>
                    handleInputChange("max_attempts", e.target.value)
                  }
                  placeholder={
                    formData.type === "section_final" ||
                    formData.type === "global_final"
                      ? "По умолчанию 3"
                      : "Оставьте пустым для неограниченного количества"
                  }
                  min="1"
                />
                <p className="text-sm text-gray-500">
                  Для финальных тестов по умолчанию 3 попытки, для остальных
                  неограничено
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Вопросы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activeQuestions.map((q, qIdx) => {
                  const originalIdx = questions.findIndex(orig => orig === q);
                  return (
                    <div key={originalIdx} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold">Вопрос {qIdx + 1}</span>
                        {activeQuestions.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeQuestion(originalIdx)}
                          >
                            Удалить вопрос
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label>Текст вопроса</Label>
                          <Textarea
                            value={q.text}
                            onChange={(e) => handleQuestionChange(originalIdx, 'text', e.target.value)}
                            placeholder="Введите текст вопроса"
                            required
                            rows={2}
                          />
                        </div>

                        <div>
                          <Label>Подсказка (опционально)</Label>
                          <Textarea
                            value={q.hint || ''}
                            onChange={(e) => handleQuestionChange(originalIdx, 'hint', e.target.value)}
                            placeholder="Введите подсказку"
                            rows={1}
                          />
                        </div>

                        <div>
                          <Label>Тип вопроса</Label>
                          <Select
                            value={q.question_type}
                            onValueChange={(value) => handleQuestionChange(originalIdx, 'question_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single_choice">Одиночный выбор</SelectItem>
                              <SelectItem value="multiple_choice">Множественный выбор</SelectItem>
                              <SelectItem value="open_text">Открытый текст</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {q.question_type === 'open_text' ? (
                          <div>
                            <Label>Правильный ответ</Label>
                            <Input
                              value={q.correct_answer as string}
                              onChange={(e) => handleCorrectAnswerChange(originalIdx, e.target.value)}
                              placeholder="Введите правильный ответ"
                              required
                            />
                          </div>
                        ) : (
                          <div>
                            <Label>Варианты ответов</Label>
                            <div className="space-y-2">
                              {q.options?.map((option, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => handleOptionChange(originalIdx, oIdx, e.target.value)}
                                    placeholder={`Вариант ${oIdx + 1}`}
                                    required
                                    className="flex-1"
                                  />

                                  {q.question_type === 'single_choice' ? (
                                    <input
                                      type="radio"
                                      name={`correct-${originalIdx}`}
                                      checked={q.correct_answer === oIdx}
                                      onChange={() => handleCorrectAnswerChange(originalIdx, oIdx)}
                                    />
                                  ) : (
                                    <input
                                      type="checkbox"
                                      checked={Array.isArray(q.correct_answer) && q.correct_answer.includes(oIdx)}
                                      onChange={(e) => {
                                        const currentAnswers = Array.isArray(q.correct_answer) ? q.correct_answer : [];
                                        if (e.target.checked) {
                                          handleCorrectAnswerChange(originalIdx, [...currentAnswers, oIdx]);
                                        } else {
                                          handleCorrectAnswerChange(originalIdx, currentAnswers.filter(idx => idx !== oIdx));
                                        }
                                      }}
                                    />
                                  )}

                                  <span className="text-sm text-gray-600">Правильный</span>

                                  {q.options && q.options.length > 2 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeAnswer(originalIdx, oIdx)}
                                    >
                                      ✕
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addAnswer(originalIdx)}
                              className="mt-2"
                            >
                              Добавить вариант
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addQuestion}
                  className="w-full"
                >
                  Добавить вопрос
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded">{error}</div>}

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={saving}
              className="flex items-center"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Сохранить изменения
            </Button>
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
            >
              Отмена
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditTest;