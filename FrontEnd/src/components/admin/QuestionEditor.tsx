import React, { useEffect, useState } from 'react';
import { questionApi, Question } from '@/services/questionApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';

interface QuestionEditorProps {
  testId: number;
}

const defaultForm = {
  question: '',
  question_type: 'text',
  options: [''],
  correct_answer: '',
  hint: '',
  is_final: false,
};

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ testId }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<any>(defaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    questionApi
      .getQuestionsByTestId(testId)
      .then(setQuestions)
      .catch(() => setError('Ошибка загрузки вопросов'))
      .finally(() => setLoading(false));
  }, [testId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleOptionChange = (idx: number, value: string) => {
    setForm((f: any) => ({ ...f, options: f.options.map((opt: string, i: number) => (i === idx ? value : opt)) }));
  };

  const addOption = () => {
    setForm((f: any) => ({ ...f, options: [...(f.options || []), ''] }));
  };

  const removeOption = (idx: number) => {
    setForm((f: any) => ({ ...f, options: f.options.filter((_: string, i: number) => i !== idx) }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        const updated = await questionApi.updateQuestion(editingId, { ...form, test_id: testId });
        setQuestions((prev) => prev.map((q) => (q.id === editingId ? updated : q)));
      } else {
        const created = await questionApi.createQuestion({ ...form, test_id: testId });
        setQuestions((prev) => [...prev, created]);
      }
      resetForm();
    } catch {
      setError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (q: Question) => {
    setForm({
      question: q.question,
      question_type: q.question_type,
      options: q.options || [''],
      correct_answer: q.correct_answer || '',
      hint: q.hint || '',
      is_final: q.is_final,
    });
    setEditingId(q.id);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить вопрос?')) return;
    try {
      await questionApi.deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      if (editingId === id) resetForm();
    } catch {
      setError('Ошибка удаления');
    }
  };

  return (
    <div>
      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {questions.length === 0 && <div className="text-muted-foreground">Нет вопросов</div>}
            {questions.map((q) => (
              <div key={q.id} className="border rounded p-3 flex flex-col gap-1 bg-slate-50">
                <div className="font-semibold">{q.question}</div>
                <div className="text-xs text-muted-foreground">Тип: {q.question_type}</div>
                {q.options && q.options.length > 0 && (
                  <ul className="list-disc pl-5 text-sm">
                    {q.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                )}
                {q.hint && <div className="text-xs text-blue-600">Подсказка: {q.hint}</div>}
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(q)}>Редактировать</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(q.id)}>Удалить</Button>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
            <div className="font-semibold mb-2">{editingId ? 'Редактировать вопрос' : 'Добавить вопрос'}</div>
            <Input
              name="question"
              value={form.question}
              onChange={handleChange}
              placeholder="Текст вопроса"
              required
            />
            <select
              name="question_type"
              value={form.question_type}
              onChange={handleSelectChange}
              className="w-full border rounded px-2 py-1"
            >
              <option value="text">Текстовый</option>
              <option value="single_choice">Один из списка</option>
              <option value="multiple_choice">Несколько из списка</option>
            </select>
            {(form.question_type === 'single_choice' || form.question_type === 'multiple_choice') && (
              <div>
                <div className="mb-1 text-xs">Варианты ответа:</div>
                {form.options.map((opt: string, idx: number) => (
                  <div key={idx} className="flex gap-2 mb-1">
                    <Input
                      value={opt}
                      onChange={e => handleOptionChange(idx, e.target.value)}
                      placeholder={`Вариант ${idx + 1}`}
                      required
                    />
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeOption(idx)} disabled={form.options.length <= 1}>–</Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={addOption}>Добавить вариант</Button>
                <Input
                  name="correct_answer"
                  value={form.correct_answer}
                  onChange={handleChange}
                  placeholder="Правильный ответ (индекс или текст)"
                  className="mt-2"
                />
              </div>
            )}
            <Textarea
              name="hint"
              value={form.hint}
              onChange={handleChange}
              placeholder="Подсказка (необязательно)"
            />
            <div className="flex gap-2 items-center">
              <input
                type="checkbox"
                name="is_final"
                checked={form.is_final}
                onChange={e => setForm((f: any) => ({ ...f, is_final: e.target.checked }))}
                id="is_final"
              />
              <label htmlFor="is_final" className="text-sm">Финальный вопрос</label>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <DialogFooter>
              <Button type="submit" disabled={saving}>{saving ? 'Сохранение...' : (editingId ? 'Сохранить' : 'Добавить')}</Button>
              {editingId && <Button type="button" variant="outline" onClick={resetForm}>Отмена</Button>}
            </DialogFooter>
          </form>
        </>
      )}
    </div>
  );
};

export default QuestionEditor; 