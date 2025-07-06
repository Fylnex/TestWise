import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
    // Здесь должен быть вызов API для создания теста
    setTimeout(() => {
      setLoading(false);
      navigate(-1);
    }, 1200);
  };

  return (
    <div className="bg-white min-h-screen py-10 px-4 md:px-24">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Создание теста</h1>
      <div className="prose max-w-none mb-10 text-gray-800">
        <p>На этой странице вы можете создать новый тест для секции или темы. Заполните название, выберите тип теста и добавьте вопросы с вариантами ответов.</p>
        <p>Рекомендации по созданию тестов:</p>
        <ul>
          <li>Формулируйте вопросы чётко и понятно</li>
          <li>Добавляйте не менее двух вариантов ответа</li>
          <li>Отмечайте правильный вариант для автоматической проверки</li>
          <li>Используйте изображения, если это поможет понять вопрос</li>
          <li>Проверяйте тест перед публикацией</li>
        </ul>
        <p>Тесты помогают закрепить материал и проверить знания студентов.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
          {placeholderImages.map((src, i) => (
            <img key={i} src={src} alt="Пример" className="rounded-xl shadow-md w-full h-48 object-cover" />
          ))}
        </div>
        <p>Заполните форму ниже, чтобы создать новый тест и добавить к нему вопросы.</p>
      </div>
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-gray-50 rounded-2xl shadow p-8 flex flex-col gap-6">
        <label className="font-semibold text-gray-700">Название теста</label>
        <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Введите название" />
        <label className="font-semibold text-gray-700">Тип теста</label>
        <select value={type} onChange={e => setType(e.target.value)} className="border rounded px-3 py-2">
          <option value="hinted">С подсказками</option>
          <option value="section_final">Финальный по секции</option>
          <option value="global_final">Глобальный финальный</option>
        </select>
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
              <Textarea value={q.text} onChange={e => handleQuestionChange(qIdx, e.target.value)} required rows={2} placeholder="Текст вопроса..." />
              <div className="mt-3 flex flex-col gap-2">
                {q.answers.map((a, aIdx) => (
                  <div key={aIdx} className="flex items-center gap-2">
                    <Input value={a} onChange={e => handleAnswerChange(qIdx, aIdx, e.target.value)} required placeholder={`Вариант ${aIdx + 1}`} />
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
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Создание...' : 'Создать тест'}
        </Button>
      </form>
    </div>
  );
} 