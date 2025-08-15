import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Image as ImageIcon, X, Save, Edit3 } from 'lucide-react';
import { questionApi, CreateQuestionData, UpdateQuestionData, Question } from '@/services/questionApi';
import { useToast } from '@/hooks/use-toast';

interface QuestionFormData {
  id?: number;
  question: string;
  question_type: 'single_choice' | 'multiple_choice' | 'open_text';
  options: string[];
  correct_answer: number | number[] | string;
  hint?: string;
  image?: string;
  image_file?: File;
  is_final: boolean;
}

const emptyQuestion: QuestionFormData = {
  question: '',
  question_type: 'single_choice',
  options: ['', ''],
  correct_answer: 0,
  hint: '',
  is_final: false,
};

interface QuestionEditorProps {
  testId: number;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ testId }) => {
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const { toast } = useToast();

  // Загружаем существующие вопросы
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        const existingQuestions = await questionApi.getQuestionsByTest(testId);
        const formattedQuestions: QuestionFormData[] = existingQuestions.map(q => ({
          id: q.id,
          question: q.question,
          question_type: q.question_type,
          options: q.options || [],
          correct_answer: q.correct_answer || (q.question_type === 'single_choice' ? 0 : 
                                              q.question_type === 'multiple_choice' ? [] : ''),
          hint: q.hint,
          image: q.image,
          is_final: q.is_final,
        }));
        setQuestions(formattedQuestions);
      } catch (error) {
        console.error('Error loading questions:', error);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить вопросы",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [testId, toast]);

  const handleQuestionChange = (index: number, field: keyof QuestionFormData, value: any) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === index) {
        const updated = { ...q, [field]: value };
        
        // При смене типа вопроса сбрасываем опции и правильный ответ
        if (field === 'question_type') {
          if (value === 'open_text') {
            updated.options = [];
            updated.correct_answer = '';
          } else if (value === 'single_choice') {
            updated.options = q.options.length > 0 ? q.options : ['', ''];
            updated.correct_answer = 0;
          } else if (value === 'multiple_choice') {
            updated.options = q.options.length > 0 ? q.options : ['', ''];
            updated.correct_answer = [];
          }
        }
        
        return updated;
      }
      return q;
    }));
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === questionIndex) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const addOption = (questionIndex: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === questionIndex) {
        return { ...q, options: [...q.options, ''] };
      }
      return q;
    }));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === questionIndex && q.options.length > 2) {
        const newOptions = q.options.filter((_, idx) => idx !== optionIndex);
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleCorrectAnswerChange = (questionIndex: number, value: number | number[] | string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === questionIndex) {
        return { ...q, correct_answer: value };
      }
      return q;
    }));
  };

  const addQuestion = () => {
    setQuestions(prev => [...prev, { ...emptyQuestion }]);
  };

  const removeQuestion = (index: number) => {
    if (questions[index].id) {
      // Если это существующий вопрос, удаляем его
      questionApi.deleteQuestion(questions[index].id!).catch(console.error);
    }
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const saveQuestion = async (index: number) => {
    const question = questions[index];
    
    // Валидация
    if (!question.question.trim()) {
      toast({
        title: "Ошибка",
        description: "Текст вопроса не может быть пустым",
        variant: "destructive",
      });
      return;
    }

    if (question.question_type !== 'open_text' && question.options.length < 2) {
      toast({
        title: "Ошибка",
        description: "Должно быть минимум 2 варианта ответа",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      if (question.id) {
        // Обновляем существующий вопрос
        const updateData: UpdateQuestionData = {
          question: question.question,
          question_type: question.question_type,
          options: question.question_type !== 'open_text' ? question.options : undefined,
          correct_answer: question.correct_answer,
          hint: question.hint,
          is_final: question.is_final,
          image: question.image,
        };

        if (question.image_file) {
          // Здесь нужно добавить логику загрузки файла
          // const formData = new FormData();
          // formData.append('image', question.image_file);
          // updateData.image_file = question.image_file;
        }

        await questionApi.updateQuestion(question.id, updateData);
        toast({
          title: "Успешно",
          description: "Вопрос обновлен",
        });
      } else {
        // Создаем новый вопрос
        const createData: CreateQuestionData = {
          test_id: testId,
          question: question.question,
          question_type: question.question_type,
          options: question.question_type !== 'open_text' ? question.options : undefined,
          correct_answer: question.correct_answer,
          hint: question.hint,
          is_final: question.is_final,
          image: question.image,
        };

        if (question.image_file) {
          createData.image_file = question.image_file;
        }

        const newQuestion = await questionApi.createQuestion(createData);
        
        // Обновляем локальное состояние с новым ID
        setQuestions(prev => prev.map((q, i) => 
          i === index ? { ...q, id: newQuestion.id } : q
        ));
        
        toast({
          title: "Успешно",
          description: "Вопрос создан",
        });
      }
      
      setEditingQuestion(null);
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить вопрос",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (questionIndex: number, file: File) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === questionIndex) {
        return { ...q, image_file: file, image: URL.createObjectURL(file) };
      }
      return q;
    }));
  };

  const removeImage = (questionIndex: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === questionIndex) {
        return { ...q, image: undefined, image_file: undefined };
      }
      return q;
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка вопросов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {questions.map((question, index) => (
        <Card key={index} className="border-2 border-gray-100 hover:border-blue-200 transition-colors">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Вопрос {index + 1}</CardTitle>
              <div className="flex gap-2">
                {editingQuestion === index ? (
                  <Button
                    size="sm"
                    onClick={() => saveQuestion(index)}
                    disabled={saving}
                    className="flex items-center gap-1"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingQuestion(index)}
                    className="flex items-center gap-1"
                  >
                    <Edit3 className="h-4 w-4" />
                    Редактировать
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeQuestion(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Текст вопроса */}
            <div>
              <Label htmlFor={`question-${index}`}>Текст вопроса</Label>
              <Textarea
                id={`question-${index}`}
                value={question.question}
                onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                placeholder="Введите текст вопроса"
                rows={3}
                disabled={editingQuestion !== index}
              />
            </div>

            {/* Тип вопроса */}
            <div>
              <Label htmlFor={`type-${index}`}>Тип вопроса</Label>
              <Select
                value={question.question_type}
                onValueChange={(value: any) => handleQuestionChange(index, 'question_type', value)}
                disabled={editingQuestion !== index}
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

            {/* Подсказка */}
            <div>
              <Label htmlFor={`hint-${index}`}>Подсказка (опционально)</Label>
              <Textarea
                id={`hint-${index}`}
                value={question.hint || ''}
                onChange={(e) => handleQuestionChange(index, 'hint', e.target.value)}
                placeholder="Введите подсказку"
                rows={2}
                disabled={editingQuestion !== index}
              />
            </div>

            {/* Изображение */}
            <div>
              <Label>Изображение (опционально)</Label>
              <div className="flex items-center gap-4">
                {question.image && (
                  <div className="relative">
                    <img
                      src={question.image}
                      alt="Question"
                      className="w-32 h-24 object-cover rounded border"
                    />
                    {editingQuestion === index && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
                {editingQuestion === index && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(index, file);
                        }
                      }}
                      className="max-w-xs"
                    />
                    <ImageIcon className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Варианты ответов или правильный ответ */}
            {question.question_type === 'open_text' ? (
              <div>
                <Label htmlFor={`correct-${index}`}>Правильный ответ</Label>
                <Input
                  id={`correct-${index}`}
                  value={question.correct_answer as string}
                  onChange={(e) => handleCorrectAnswerChange(index, e.target.value)}
                  placeholder="Введите правильный ответ"
                  disabled={editingQuestion !== index}
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Варианты ответов</Label>
                  {editingQuestion === index && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addOption(index)}
                      className="flex items-center gap-1"
                    >
                      <PlusCircle className="h-3 w-3" />
                      Добавить вариант
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)}
                        placeholder={`Вариант ${optionIndex + 1}`}
                        disabled={editingQuestion !== index}
                        className="flex-1"
                      />
                      
                      {/* Чекбокс/радио для правильного ответа */}
                      {question.question_type === 'single_choice' ? (
                        <input
                          type="radio"
                          name={`correct-${index}`}
                          checked={question.correct_answer === optionIndex}
                          onChange={() => handleCorrectAnswerChange(index, optionIndex)}
                          disabled={editingQuestion !== index}
                          className="h-4 w-4 text-blue-600"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={Array.isArray(question.correct_answer) && question.correct_answer.includes(optionIndex)}
                          onChange={(e) => {
                            const currentAnswers = Array.isArray(question.correct_answer) ? question.correct_answer : [];
                            if (e.target.checked) {
                              handleCorrectAnswerChange(index, [...currentAnswers, optionIndex]);
                            } else {
                              handleCorrectAnswerChange(index, currentAnswers.filter(idx => idx !== optionIndex));
                            }
                          }}
                          disabled={editingQuestion !== index}
                          className="h-4 w-4 text-blue-600"
                        />
                      )}
                      
                      <span className="text-sm text-gray-600 w-16">
                        {question.question_type === 'single_choice' ? 'Правильный' : 'Правильный'}
                      </span>
                      
                      {editingQuestion === index && question.options.length > 2 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeOption(index, optionIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Флаг итогового вопроса */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`final-${index}`}
                checked={question.is_final}
                onChange={(e) => handleQuestionChange(index, 'is_final', e.target.checked)}
                disabled={editingQuestion !== index}
                className="h-4 w-4 text-blue-600"
              />
              <Label htmlFor={`final-${index}`}>Итоговый вопрос</Label>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        onClick={addQuestion}
        className="w-full py-6 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50"
        variant="outline"
      >
        <PlusCircle className="h-6 w-6 mr-2" />
        Добавить новый вопрос
      </Button>
    </div>
  );
}; 