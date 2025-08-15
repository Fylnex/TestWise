import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { testApi, Test } from '@/services/testApi';
import { questionApi } from '@/services/questionApi';

interface QuestionForm {
  text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'open_text';
  hint: string;
  options?: string[];
  correct_answer: number | number[] | string;
}

const emptyQuestion: QuestionForm = {
  text: '',
  question_type: 'single_choice',
  hint: '',
  options: ['', ''],
  correct_answer: 0
};

export default function CreateTestForSection() {
  const { topicId, sectionId } = useParams<{ topicId?: string; sectionId?: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'hinted' | 'section_final' | 'global_final'>('hinted');
  const [duration, setDuration] = useState('');
  const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxAttempts, setMaxAttempts] = useState<string | undefined>(
    type === "section_final" || type === "global_final" ? "3" : undefined
  );

  const isSectionTest = Boolean(sectionId);
  const isTopicTest = !sectionId && Boolean(topicId);

  const handleAddQuestion = () => setQuestions(qs => [...qs, { ...emptyQuestion }]);
  
  const handleRemoveQuestion = (idx: number) =>
    setQuestions(qs => qs.length > 1 ? qs.filter((_, i) => i !== idx) : qs);

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

  const handleAddAnswer = (qIdx: number) =>
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { 
      ...q, 
      options: q.options ? [...q.options, ''] : ['', ''] 
    } : q));

  const handleRemoveAnswer = (qIdx: number, aIdx: number) =>
    setQuestions(qs => qs.map((q, i) => i === qIdx
      ? { ...q, options: q.options && q.options.length > 2 ? q.options.filter((_, j) => j !== aIdx) : q.options }
      : q
    ));

  const handleSetMaxAttempts = (value: string) => {
    const numValue = value ? Number(value) : undefined;
    setMaxAttempts(numValue !== undefined && numValue < 1 ? "1" : value);
  };

  const validateQuestions = (): boolean => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
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
    
    setLoading(true);
    setError(null);
    
    try {
      const testPayload: Partial<Test> = {
        title,
        type,
        duration: duration ? Number(duration) : undefined,
        max_attempts: maxAttempts ? Number(maxAttempts) : undefined,
        ...(isSectionTest ? { section_id: Number(sectionId) } : { topic_id: Number(topicId) }),
      };
      const createdTest = await testApi.createTest(testPayload);

      await Promise.all(questions.map(q =>
        questionApi.createQuestion({
          test_id: createdTest.id,
          question: q.text,
          hint: q.hint,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          is_final: type === 'section_final' || type === 'global_final',
        })
      ));

      // Перенаправляем обратно на страницу раздела или темы
      if (isSectionTest) {
        navigate(-1);
      } else {
        navigate(`/topic/${topicId}`);
      }
    } catch (err) {
      setError('Ошибка при создании теста');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">
        {isSectionTest ? "Создать тест для раздела" : "Создать тест для темы"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-1 font-medium">Название теста</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Тип теста</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            {isTopicTest ? (
              <option value="global_final">Итоговый тест</option>
            ) : (
              <>
                <option value="hinted">Тест с подсказками</option>
                <option value="section_final">Итоговый тест по разделу</option>
              </>
            )}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">
            Время (минуты, опционально)
          </label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="0"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">
            Максимум попыток (опционально)
          </label>
          <Input
            type="number"
            value={maxAttempts || ""}
            onChange={(e) => handleSetMaxAttempts(e.target.value)}
            placeholder={
              type === "section_final" || type === "global_final"
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
        <div className="space-y-8">
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Вопрос {qIdx + 1}</span>
                {questions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleRemoveQuestion(qIdx)}
                  >
                    Удалить вопрос
                  </Button>
                )}
              </div>
              
              <Textarea
                className="mb-2"
                placeholder="Текст вопроса"
                value={q.text}
                onChange={(e) =>
                  handleQuestionChange(qIdx, "text", e.target.value)
                }
                required
              />
              
              <Textarea
                className="mb-2"
                placeholder="Подсказка (опционально)"
                value={q.hint}
                onChange={(e) =>
                  handleQuestionChange(qIdx, "hint", e.target.value)
                }
              />
              
              <div className="mb-2">
                <label className="block mb-1 font-medium">Тип вопроса</label>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={q.question_type}
                  onChange={(e) => handleQuestionChange(qIdx, "question_type", e.target.value)}
                >
                  <option value="single_choice">Одиночный выбор</option>
                  <option value="multiple_choice">Множественный выбор</option>
                  <option value="open_text">Открытый текст</option>
                </select>
              </div>

              {q.question_type === 'open_text' ? (
                <div className="mb-2">
                  <label className="block mb-1 font-medium">Правильный ответ</label>
                  <Input
                    placeholder="Введите правильный ответ"
                    value={q.correct_answer as string}
                    onChange={(e) => handleCorrectAnswerChange(qIdx, e.target.value)}
                    required
                  />
                </div>
              ) : (
                <>
                  <div className="mb-2 font-medium">Варианты ответа:</div>
                  {q.options?.map((option, aIdx) => (
                    <div key={aIdx} className="flex items-center gap-2 mb-1">
                      <Input
                        className="flex-1"
                        placeholder={`Вариант ${aIdx + 1}`}
                        value={option}
                        onChange={(e) => handleOptionChange(qIdx, aIdx, e.target.value)}
                        required
                      />
                      
                      {q.question_type === 'single_choice' ? (
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={q.correct_answer === aIdx}
                          onChange={() => handleCorrectAnswerChange(qIdx, aIdx)}
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={Array.isArray(q.correct_answer) && q.correct_answer.includes(aIdx)}
                          onChange={(e) => {
                            const currentAnswers = Array.isArray(q.correct_answer) ? q.correct_answer : [];
                            if (e.target.checked) {
                              handleCorrectAnswerChange(qIdx, [...currentAnswers, aIdx]);
                            } else {
                              handleCorrectAnswerChange(qIdx, currentAnswers.filter(idx => idx !== aIdx));
                            }
                          }}
                        />
                      )}
                      
                      <span className="text-xs">Правильный</span>
                      
                      {q.options && q.options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleRemoveAnswer(qIdx, aIdx)}
                        >
                          Удалить
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAddAnswer(qIdx)}
                    className="mt-2"
                  >
                    Добавить вариант
                  </Button>
                </>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" onClick={handleAddQuestion}>
            Добавить вопрос
          </Button>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Создание..." : "Сохранить тест"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
}