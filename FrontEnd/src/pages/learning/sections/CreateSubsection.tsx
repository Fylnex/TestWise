import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ArrowLeft, Save, Upload, FileText, File } from 'lucide-react';
import Header from '@/components/Header';
import { sectionApi } from '@/services/sectionApi';
import { topicApi } from '@/services/topicApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import http from '@/services/apiConfig';

interface SubsectionFormData {
  title: string;
  content: string;
  type: 'text' | 'pdf';
  order: number;
  file?: File;
}

export default function CreateSubsection() {
  const { sectionId, topicId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Проверка прав доступа
  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-10 text-center text-red-500">
          У вас нет прав для создания подразделов
        </div>
      </div>
    );
  }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState<any>(null);
  const [topicTitle, setTopicTitle] = useState<string>('');
  const [sectionTitle, setSectionTitle] = useState<string>('');
  const [existingSubsections, setExistingSubsections] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SubsectionFormData>({
    title: '',
    content: '',
    type: 'text',
    order: 0
  });

  // Загрузка данных секции и определение порядка
  useEffect(() => {
    if (!sectionId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Загружаем секцию
        const sectionData = await sectionApi.getSection(Number(sectionId));
        setSection(sectionData);

        // Загружаем информацию о теме (используем topicId из URL или из секции)
        const topicIdToUse = topicId || sectionData.topic_id;
        const topicData = await topicApi.getTopic(Number(topicIdToUse));
        setTopicTitle(topicData.title);
        setSectionTitle(sectionData.title);

        // Загружаем существующие подразделы для определения порядка
        const subsectionsResponse = await sectionApi.getSectionSubsections(Number(sectionId));
        const subsections = subsectionsResponse.subsections || [];
        setExistingSubsections(subsections);

        // Автоматически устанавливаем порядок как количество существующих подразделов + 1
        const nextOrder = subsections.length + 1;
        setFormData(prev => ({
          ...prev,
          order: nextOrder
        }));

      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setError('Ошибка загрузки данных секции');
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные секции",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sectionId, topicId, toast]);

  const handleInputChange = (field: keyof SubsectionFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file,
        type: 'pdf'
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionId) return;

    try {
      setSaving(true);
      setError(null);

      let newSubsection: any;

      if (formData.type === 'pdf' && formData.file) {
        // Создание PDF подраздела
        const formDataToSend = new FormData();
        formDataToSend.append('section_id', String(sectionId));
        formDataToSend.append('title', formData.title);
        formDataToSend.append('type', 'pdf');
        formDataToSend.append('order', String(formData.order));
        formDataToSend.append('file', formData.file);

        newSubsection = await sectionApi.createSubsection(formDataToSend);
      } else {
        // Создание текстового подраздела
        const payload = {
          section_id: Number(sectionId),
          title: formData.title,
          content: formData.content,
          type: 'text' as const,
          order: formData.order
        };

        newSubsection = await sectionApi.createSubsectionJson(payload);
      }

      toast({
        title: "Успешно",
        description: "Подраздел успешно создан",
      });

      // Возвращаемся к странице темы
      const topicIdToUse = topicId || section.topic_id;
      navigate(`/topic/${topicIdToUse}`);

    } catch (err) {
      console.error('Ошибка создания:', err);
      setError('Ошибка при создании подраздела');
      toast({
        title: "Ошибка",
        description: "Не удалось создать подраздел",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const topicIdToUse = topicId || section?.topic_id;
    navigate(`/topic/${topicIdToUse}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-10 text-center text-gray-400">
          Загрузка...
        </div>
      </div>
    );
  }

  if (error || !section) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-10 text-center text-red-500">
          {error || 'Секция не найдена'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto w-full max-w-4xl px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Создание подраздела
            </h1>
          </div>
          <div className="text-gray-600">
            <p><strong>Тема:</strong> {topicTitle}</p>
            <p><strong>Раздел:</strong> {sectionTitle}</p>
            <p><strong>Порядок:</strong> {formData.order} (автоматически установлен)</p>
          </div>
        </div>

        {/* Форма создания */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Название */}
            <div>
              <Label htmlFor="title">Название подраздела</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Введите название подраздела"
                required
              />
            </div>

            {/* Тип контента */}
            <div>
              <Label htmlFor="type">Тип контента</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'text' | 'pdf') => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Текстовый контент
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4" />
                      PDF документ
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Порядок (только для чтения) */}
            <div>
              <Label htmlFor="order">Порядок</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 0)}
                placeholder="0"
                min="1"
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500 mt-1">
                Автоматически установлен как {formData.order} (после {existingSubsections.length} существующих подразделов)
              </p>
            </div>

            {/* Контент в зависимости от типа */}
            {formData.type === 'text' ? (
              <div>
                <Label htmlFor="content">Содержимое</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Введите содержимое подраздела"
                  rows={10}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="file">PDF файл</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-800">
                      Выберите PDF файл
                    </span>
                    <span className="text-gray-500"> или перетащите его сюда</span>
                  </label>
                  {formData.file && (
                    <p className="mt-2 text-sm text-gray-600">
                      Выбран файл: {formData.file.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Создание...' : 'Создать'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                Отмена
              </Button>
            </div>

            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
} 