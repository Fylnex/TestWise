import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { topicApi } from '@/services/topicApi';
import { Loader2, ArrowLeft } from 'lucide-react';

const CreateTopic = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    image: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      setError("Название темы является обязательным полем.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const newTopic = await topicApi.createTopic(form);
      toast({
        title: "Тема успешно создана!",
        description: `Тема "${newTopic.title}" добавлена.`,
      });
      window.dispatchEvent(new Event('topics-updated'));
      navigate(`/topic/${newTopic.id}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Произошла ошибка при создании темы.';
      setError(errorMessage);
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-10 max-w-2xl">
        <div className="mb-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к темам
            </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Создание новой темы</CardTitle>
            <CardDescription>Заполните информацию о новой теме, которую вы хотите добавить на платформу.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="title" className="font-medium">Название темы</label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Например, 'Основы термодинамики'"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="font-medium">Описание</label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Кратко опишите, о чем эта тема"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="category" className="font-medium">Категория</label>
                <Input
                  id="category"
                  name="category"
                  placeholder="Например, 'Физика'"
                  value={form.category}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="image" className="font-medium">URL изображения (необязательно)</label>
                <Input
                  id="image"
                  name="image"
                  placeholder="https://example.com/image.jpg"
                  value={form.image}
                  onChange={handleChange}
                />
                 {form.image && (
                  <div className="mt-2">
                    <img src={form.image} alt="Предпросмотр" className="rounded-lg max-h-48 object-cover" />
                  </div>
                )}
              </div>
              {error && <p className="text-destructive text-sm font-medium">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? 'Создание...' : 'Создать тему'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateTopic; 