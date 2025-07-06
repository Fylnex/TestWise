 // TestWise/src/pages/EditTest.tsx
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
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';

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
  });

  useEffect(() => {
    if (!testId) return;
    
    const loadTest = async () => {
      try {
        setLoading(true);
        const testData = await testApi.getTest(Number(testId));
        setTest(testData);
        setFormData({
          title: testData.title,
          type: testData.type,
          duration: testData.duration?.toString() || '',
        });
      } catch (err) {
        setError('Ошибка загрузки теста');
        console.error('Error loading test:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testId) return;

    try {
      setSaving(true);
      setError(null);
      
      const updateData = {
        title: formData.title,
        type: formData.type,
        duration: formData.duration ? Number(formData.duration) : null,
      };

      await testApi.updateTest(Number(testId), updateData);
      
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

  if (error) {
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

  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-2xl">
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

        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Название теста</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Введите название теста"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Тип теста</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип теста" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hinted">С подсказками</SelectItem>
                    <SelectItem value="section_final">Финальный по разделу</SelectItem>
                    <SelectItem value="global_final">Глобальный финальный</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Длительность (минуты)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="Оставьте пустым для неограниченного времени"
                  min="1"
                />
                <p className="text-sm text-gray-500">
                  Оставьте поле пустым, если время не ограничено
                </p>
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EditTest;