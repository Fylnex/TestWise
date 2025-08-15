import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, FileText, ListChecks } from 'lucide-react';
import Header from '@/components/Header';
import { testApi } from '@/services/testApi';
import { questionApi } from '@/services/questionApi';

interface QuestionForm {
  text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'open_text';
  options?: string[];
  correct_answer: number | number[] | string;
}

const emptyQuestion: QuestionForm = {
  text: '',
  question_type: 'single_choice',
  options: ['', ''],
  correct_answer: 0
};

export default function CreateTest() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('hinted');
  const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const addAnswer = (qIdx: number) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? {
      ...q,
      options: q.options ? [...q.options, ''] : ['', '']
    } : q));
  };

  const removeQuestion = (idx: number) => {
    if (questions.length > 1) {
      setQuestions(qs => qs.filter((_, i) => i !== idx));
    }
  };

  const removeAnswer = (qIdx: number, aIdx: number) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? {
      ...q,
      options: q.options && q.options.length > 2 ? q.options.filter((_, j) => j !== aIdx) : q.options
    } : q));
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
      // Создаем тест
      const testData = await testApi.createTest({
        title,
        type,
        section_id: sectionId ? Number(sectionId) : undefined,
      });

      // Создаем вопросы
      await Promise.all(questions.map(q =>
        questionApi.createQuestion({
          test_id: testData.id,
          question: q.text,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          is_final: type === 'section_final' || type === 'global_final',
        })
      ));

      navigate(-1);
    } catch (err) {
      setError('Ошибка при создании теста');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(circle, #e5e7eb 1px, transparent 1.5px)', backgroundSize: '32px 32px', backgroundColor: 'white' }}>
      <Header />
      <div className="flex-1 flex flex-col items-center w-full py-8">
        <div className="w-full h-full flex flex-col lg:flex-row items-stretch gap-0 lg:gap-12 max-w-6xl mx-auto px-2 animate-fade-in-up">
          {/* Левая колонка — инфо и подсказки */}
          <aside className="w-full lg:w-1/3 bg-white/80 rounded-t-3xl lg:rounded-l-3xl lg:rounded-tr-none shadow-xl border border-gray-100 p-8 flex flex-col justify-between mb-0 lg:mb-0">
            <div>
              <h2 className="text-2xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
                <ListChecks className="w-7 h-7 text-indigo-600" />
                Новый тест
              </h2>
              <div className="space-y-2 text-base text-gray-700 mb-6">
                <div className="flex items-center gap-2"><span className="font-semibold">Секция:</span> <span>{sectionId || '...'}</span></div>
                <div className="flex items-center gap-2"><span className="font-semibold">Вопросов:</span> <span>{questions.length}</span></div>
              </div>
              <div className="mt-8 space-y-4 text-gray-500 text-sm">
                <div className="bg-indigo-50 rounded-xl p-4">
                  <b>Совет:</b> Название теста должно быть коротким и отражать суть.<br/>Например: <i>Промежуточный тест</i>, <i>Финальный</i>.
                </div>
                <div className="bg-indigo-50 rounded-xl p-4">
                  <b>Тип теста:</b> <br/>С подсказками — для тренировки, финальный — для проверки знаний.
                </div>
                <div className="bg-indigo-50 rounded-xl p-4">
                  <b>Типы вопросов:</b> <br/>Одиночный выбор, множественный выбор или открытый текст.
                </div>
              </div>
            </div>
          </aside>

          {/* Правая колонка — форма */}
          <main className="w-full lg:w-2/3 bg-white/90 rounded-b-3xl lg:rounded-r-3xl lg:rounded-bl-none shadow-xl border border-gray-100 p-8 flex flex-col justify-center">
            <form onSubmit={handleSubmit} className="space-y-10 w-full mx-auto">
              {/* Название */}
              <div>
                <Label htmlFor="title" className="font-semibold text-gray-800 text-lg">Название теста</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Введите название теста"
                  required
                  className="mt-3 text-lg py-4 px-4"
                />
              </div>

              {/* Тип теста */}
              <div>
                <Label htmlFor="type" className="font-semibold text-gray-800 text-lg">Тип теста</Label>
                <select
                  id="type"
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="mt-3 text-lg py-4 px-4 border rounded w-full"
                >
                  <option value="hinted">С подсказками</option>
                  <option value="section_final">Финальный по секции</option>
                  <option value="global_final">Глобальный финальный</option>
                </select>
              </div>

              {/* Вопросы */}
              <div className="flex flex-col gap-8">
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="bg-white border rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800">Вопрос {qIdx + 1}</span>
                      {questions.length > 1 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => removeQuestion(qIdx)}>
                          Удалить вопрос
                        </Button>
                      )}
                    </div>

                    <Textarea
                      value={q.text}
                      onChange={e => handleQuestionChange(qIdx, 'text', e.target.value)}
                      required
                      rows={2}
                      placeholder="Текст вопроса..."
                      className="text-base mb-3"
                    />

                    <div className="mb-3">
                      <Label className="font-semibold text-gray-700">Тип вопроса</Label>
                      <select
                        value={q.question_type}
                        onChange={e => handleQuestionChange(qIdx, 'question_type', e.target.value)}
                        className="mt-1 text-base py-2 px-3 border rounded w-full"
                      >
                        <option value="single_choice">Одиночный выбор</option>
                        <option value="multiple_choice">Множественный выбор</option>
                        <option value="open_text">Открытый текст</option>
                      </select>
                    </div>

                    {q.question_type === 'open_text' ? (
                      <div>
                        <Label className="font-semibold text-gray-700">Правильный ответ</Label>
                        <Input
                          value={q.correct_answer as string}
                          onChange={e => handleCorrectAnswerChange(qIdx, e.target.value)}
                          placeholder="Введите правильный ответ"
                          className="text-base mt-1"
                          required
                        />
                      </div>
                    ) : (
                      <div>
                        <Label className="font-semibold text-gray-700 mb-2 block">Варианты ответов</Label>
                        <div className="flex flex-col gap-2">
                          {q.options?.map((option, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <Input
                                value={option}
                                onChange={e => handleOptionChange(qIdx, oIdx, e.target.value)}
                                placeholder={`Вариант ${oIdx + 1}`}
                                className="text-base flex-1"
                                required
                              />

                              {q.question_type === 'single_choice' ? (
                                <input
                                  type="radio"
                                  name={`correct-${qIdx}`}
                                  checked={q.correct_answer === oIdx}
                                  onChange={() => handleCorrectAnswerChange(qIdx, oIdx)}
                                />
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={Array.isArray(q.correct_answer) && q.correct_answer.includes(oIdx)}
                                  onChange={(e) => {
                                    const currentAnswers = Array.isArray(q.correct_answer) ? q.correct_answer : [];
                                    if (e.target.checked) {
                                      handleCorrectAnswerChange(qIdx, [...currentAnswers, oIdx]);
                                    } else {
                                      handleCorrectAnswerChange(qIdx, currentAnswers.filter(idx => idx !== oIdx));
                                    }
                                  }}
                                />
                              )}

                              <span className="text-xs text-gray-500">Правильный</span>

                              {q.options && q.options.length > 2 && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeAnswer(qIdx, oIdx)}>
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
                          onClick={() => addAnswer(qIdx)}
                          className="mt-2"
                        >
                          Добавить вариант
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button type="button" variant="secondary" onClick={addQuestion} className="w-full">
                Добавить вопрос
              </Button>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <div className="flex flex-col sm:flex-row gap-6 pt-2 w-full">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 w-full sm:w-auto justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:scale-105 transition-all text-lg py-4 px-8"
                >
                  <Save className="w-6 h-6" />
                  {loading ? 'Создание...' : 'Создать тест'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  className="w-full sm:w-auto justify-center text-lg py-4 px-8"
                >
                  Отмена
                </Button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}