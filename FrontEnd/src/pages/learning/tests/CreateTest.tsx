import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, FileText, ListChecks } from 'lucide-react';
import Header from '@/components/Header';

const placeholderImages = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80',
];

export default function CreateTest() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('hinted');
  const [questions, setQuestions] = useState([
    { text: '', answers: ['', ''], correct: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuestionChange = (idx: number, value: string) => {
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, text: value } : q));
  };
  const handleAnswerChange = (qIdx: number, aIdx: number, value: string) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? {
      ...q,
      answers: q.answers.map((a, j) => j === aIdx ? value : a)
    } : q));
  };
  const handleCorrectChange = (qIdx: number, value: number) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, correct: value } : q));
  };
  const addQuestion = () => {
    setQuestions(qs => [...qs, { text: '', answers: ['', ''], correct: 0 }]);
  };
  const addAnswer = (qIdx: number) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, answers: [...q.answers, ''] } : q));
  };
  const removeQuestion = (idx: number) => {
    setQuestions(qs => qs.filter((_, i) => i !== idx));
  };
  const removeAnswer = (qIdx: number, aIdx: number) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, answers: q.answers.filter((_, j) => j !== aIdx) } : q));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
      navigate(-1);
    }, 1200);
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
                  <b>Вопросы:</b> <br/>Формулируйте чётко, добавляйте минимум 2 варианта, отмечайте правильный.
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
                  className="mt-3 text-lg py-4 px-4 border rounded"
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
                    <Textarea value={q.text} onChange={e => handleQuestionChange(qIdx, e.target.value)} required rows={2} placeholder="Текст вопроса..." className="text-base" />
                    <div className="mt-3 flex flex-col gap-2">
                      {q.answers.map((a, aIdx) => (
                        <div key={aIdx} className="flex items-center gap-2">
                          <Input value={a} onChange={e => handleAnswerChange(qIdx, aIdx, e.target.value)} required placeholder={`Вариант ${aIdx + 1}`} className="text-base" />
                          <input type="radio" name={`correct-${qIdx}`} checked={q.correct === aIdx} onChange={() => handleCorrectChange(qIdx, aIdx)} />
                          <span className="text-xs text-gray-500">Правильный</span>
                          {q.answers.length > 2 && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeAnswer(qIdx, aIdx)}>
                              ✕
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => addAnswer(qIdx)}>
                        Добавить вариант
                      </Button>
                    </div>
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