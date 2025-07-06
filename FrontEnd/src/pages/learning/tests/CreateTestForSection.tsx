// TestWise/src/pages/CreateTestForSection.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { testApi, Test } from '@/services/testApi';
import { questionApi } from '@/services/questionApi';

interface Answer {
  text: string;
  is_correct: boolean;
}
interface QuestionForm {
  text: string;
  hint: string;
  answers: Answer[];
}

const emptyAnswer: Answer = { text: '', is_correct: false };
const emptyQuestion: QuestionForm = { text: '', hint: '', answers: [emptyAnswer] };

export default function CreateTestForSection() {
  const { sectionId, topicId } = useParams<{ sectionId: string; topicId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'hinted' | 'section_final' | 'global_final'>('hinted');
  const [duration, setDuration] = useState('');
  const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTopicTest = Boolean(topicId);

  const handleAddQuestion = () => setQuestions(qs => [...qs, emptyQuestion]);
  const handleRemoveQuestion = (idx: number) =>
    setQuestions(qs => qs.length > 1 ? qs.filter((_, i) => i !== idx) : qs);
  const handleQuestionChange = (idx: number, field: keyof QuestionForm, value: string) =>
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  const handleAnswerChange = (qIdx: number, aIdx: number, field: keyof Answer, value: string | boolean) =>
    setQuestions(qs => qs.map((q, i) => i === qIdx
      ? { ...q, answers: q.answers.map((a, j) => j === aIdx ? { ...a, [field]: value } : a) }
      : q
    ));
  const handleAddAnswer = (qIdx: number) =>
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, answers: [...q.answers, emptyAnswer] } : q));
  const handleRemoveAnswer = (qIdx: number, aIdx: number) =>
    setQuestions(qs => qs.map((q, i) => i === qIdx
      ? { ...q, answers: q.answers.length > 1 ? q.answers.filter((_, j) => j !== aIdx) : q.answers }
      : q
    ));
  const handleSetCorrect = (qIdx: number, aIdx: number) =>
    setQuestions(qs => qs.map((q, i) => i === qIdx
      ? { ...q, answers: q.answers.map((a, j) => ({ ...a, is_correct: j === aIdx })) }
      : q
    ));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const testPayload: Partial<Test> = {
        title,
        type,
        duration: duration ? Number(duration) : undefined,
        ...(isTopicTest
          ? { topic_id: Number(topicId) }
          : { section_id: Number(sectionId) }),
      };
      const createdTest = await testApi.createTest(testPayload);

      await Promise.all(questions.map(q =>
        questionApi.createQuestion({
          test_id: createdTest.id,
          question: q.text,
          hint: q.hint,
          question_type: 'multiple_choice',
          options: q.answers.map(a => a.text),
          correct_answer: q.answers.find(a => a.is_correct)?.text,
          is_final: type === 'section_final' || type === 'global_final',
        })
      ));

      // Перенаправляем обратно на страницу темы или секции
      if (topicId) {
        navigate(`/topic/${topicId}`);
      } else {
        navigate(`/test/${createdTest.id}`);
      }
    } catch {
      setError('Ошибка при создании теста');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">
        {isTopicTest ? 'Создать тест для темы' : 'Создать тест для раздела'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-1 font-medium">Название теста</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1 font-medium">Тип теста</label>
          <select
            className="border rounded px-2 py-1"
            value={type}
            onChange={e => setType(e.target.value as any)}
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
          <label className="block mb-1 font-medium">Время (минуты, опционально)</label>
          <Input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            min={0}
          />
        </div>
        <div className="space-y-8">
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Вопрос {qIdx + 1}</span>
                {questions.length > 1 && (
                  <Button type="button" variant="ghost" onClick={() => handleRemoveQuestion(qIdx)}>
                    Удалить вопрос
                  </Button>
                )}
              </div>
              <Textarea
                className="mb-2"
                placeholder="Текст вопроса"
                value={q.text}
                onChange={e => handleQuestionChange(qIdx, 'text', e.target.value)}
                required
              />
              <Textarea
                className="mb-2"
                placeholder="Подсказка (опционально)"
                value={q.hint}
                onChange={e => handleQuestionChange(qIdx, 'hint', e.target.value)}
              />
              <div className="mb-2 font-medium">Варианты ответа:</div>
              {q.answers.map((a, aIdx) => (
                <div key={aIdx} className="flex items-center gap-2 mb-1">
                  <Input
                    className="flex-1"
                    placeholder={`Вариант ${aIdx + 1}`}
                    value={a.text}
                    onChange={e => handleAnswerChange(qIdx, aIdx, 'text', e.target.value)}
                    required
                  />
                  <input
                    type="radio"
                    name={`correct-${qIdx}`}
                    checked={a.is_correct}
                    onChange={() => handleSetCorrect(qIdx, aIdx)}
                  />
                  <span className="text-xs">Правильный</span>
                  {q.answers.length > 1 && (
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
            </div>
          ))}
          <Button type="button" variant="outline" onClick={handleAddQuestion}>
            Добавить вопрос
          </Button>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Создание...' : 'Сохранить тест'}
          </Button>
          <Button type="button" variant="outline" onClick={() => {
            if (topicId) {
              navigate(`/topic/${topicId}`);
            } else {
              navigate(-1);
            }
          }}>
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
}
