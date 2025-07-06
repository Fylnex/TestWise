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

export default function CreateSubsection() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Здесь должен быть вызов API для создания подсекции
    setTimeout(() => {
      setLoading(false);
      navigate(-1);
    }, 1200);
  };

  return (
    <div className="bg-white min-h-screen py-10 px-4 md:px-24">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Создание вложенной секции</h1>
      <div className="prose max-w-none mb-10 text-gray-800">
        <p>Добро пожаловать на страницу создания вложенной секции! Здесь вы можете добавить подробное описание, вставить изображения, структурировать материал и многое другое.</p>
        <p>Вложенные секции позволяют детализировать структуру курса, разбивать большие темы на логические части и делать обучение более последовательным.</p>
        <p>Преимущества использования вложенных секций:</p>
        <ul>
          <li>Гибкая организация учебного материала</li>
          <li>Возможность добавлять текст, изображения, PDF и другие ресурсы</li>
          <li>Удобство для студентов и преподавателей</li>
          <li>Повышение вовлечённости в процесс обучения</li>
        </ul>
        <p>Пример длинного текста для демонстрации:</p>
        <p>1. Вложенные секции могут содержать как теоретический материал, так и практические задания.</p>
        <p>2. Вы можете использовать форматирование, чтобы выделять важные моменты.</p>
        <p>3. Добавляйте изображения для наглядности и лучшего усвоения информации.</p>
        <p>4. Используйте списки, таблицы, цитаты и другие элементы оформления.</p>
        <p>5. Не забывайте про структурирование: делите текст на абзацы, используйте подзаголовки.</p>
        <p>6. Вложенные секции могут быть связаны с тестами и заданиями.</p>
        <p>7. Для каждого раздела можно добавить дополнительные материалы.</p>
        <p>8. Воспользуйтесь возможностью загрузить PDF-файлы, если требуется.</p>
        <p>9. Весь контент можно редактировать и обновлять в любой момент.</p>
        <p>10. Следите за прогрессом студентов по каждой секции.</p>
        <p>11. Используйте вложенные секции для пошагового раскрытия сложных тем.</p>
        <p>12. Применяйте визуальные элементы для повышения интереса.</p>
        <p>13. Встроенные инструменты позволяют быстро создавать и настраивать секции.</p>
        <p>14. Не ограничивайтесь только текстом — добавляйте видео, схемы, графики.</p>
        <p>15. Вложенные секции — ключ к эффективному обучению!</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
          {placeholderImages.map((src, i) => (
            <img key={i} src={src} alt="Пример" className="rounded-xl shadow-md w-full h-48 object-cover" />
          ))}
        </div>
        <p>Заполните форму ниже, чтобы создать новую вложенную секцию. Все поля обязательны для заполнения.</p>
      </div>
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-gray-50 rounded-2xl shadow p-8 flex flex-col gap-6">
        <label className="font-semibold text-gray-700">Название секции</label>
        <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Введите название" />
        <label className="font-semibold text-gray-700">Содержимое секции</label>
        <Textarea value={content} onChange={e => setContent(e.target.value)} required rows={8} placeholder="Введите содержимое секции..." />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Создание...' : 'Создать'}
        </Button>
      </form>
    </div>
  );
} 