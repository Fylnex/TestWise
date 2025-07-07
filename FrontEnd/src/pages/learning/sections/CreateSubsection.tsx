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
  images?: File[];
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
    order: 0,
    images: []
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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

  const handleImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    setFormData(prev => ({
      ...prev,
      images: files
    }));
    // Превью
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
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
        // Создание текстового подраздела с изображениями
        const payload = {
          section_id: Number(sectionId),
          title: formData.title,
          content: formData.content,
          type: 'text' as const,
          order: formData.order
        };
        if (formData.images && formData.images.length > 0) {
          const formDataToSend = new FormData();
          formDataToSend.append('section_id', String(sectionId));
          formDataToSend.append('title', formData.title);
          formDataToSend.append('content', formData.content);
          formDataToSend.append('type', 'text');
          formDataToSend.append('order', String(formData.order));
          formData.images.forEach((img, idx) => {
            formDataToSend.append('images', img);
          });
          newSubsection = await sectionApi.createSubsection(formDataToSend);
        } else {
          newSubsection = await sectionApi.createSubsectionJson(payload);
        }
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
    <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(circle, #e5e7eb 1px, transparent 1.5px)', backgroundSize: '32px 32px', backgroundColor: 'white' }}>
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center w-full py-8">
        <div className="w-full h-full flex flex-col lg:flex-row items-stretch justify-center gap-0 lg:gap-12 max-w-6xl mx-auto px-2">
          {/* Левая колонка — инфо и подсказки */}
          <aside className="w-full lg:w-1/3 bg-white/80 rounded-t-3xl lg:rounded-l-3xl lg:rounded-tr-none shadow-xl border border-gray-100 p-8 flex flex-col justify-between mb-0 lg:mb-0">
            <div>
              <h2 className="text-2xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
                <FileText className="w-7 h-7 text-indigo-600" />
                Новый подраздел
              </h2>
              <div className="space-y-2 text-base text-gray-700 mb-6">
                <div className="flex items-center gap-2"><span className="font-semibold">Тема:</span> <span>{topicTitle}</span></div>
                <div className="flex items-center gap-2"><span className="font-semibold">Раздел:</span> <span>{sectionTitle}</span></div>
                <div className="flex items-center gap-2"><span className="font-semibold">Порядок:</span> <span>{formData.order}</span></div>
              </div>
              <div className="mt-8 space-y-4 text-gray-500 text-sm">
                <div className="bg-indigo-50 rounded-xl p-4">
                  <b>Совет:</b> Название должно быть коротким и понятным.<br/>Например: <i>Введение</i>, <i>Практика 1</i>, <i>Теория</i>.
                </div>
                <div className="bg-indigo-50 rounded-xl p-4">
                  <b>Тип контента:</b> <br/>Текст — для обычных материалов, PDF — для загружаемых файлов.
                </div>
                <div className="bg-indigo-50 rounded-xl p-4">
                  <b>Содержимое:</b> <br/>Пишите просто, структурируйте текст, используйте списки и подзаголовки.
                </div>
              </div>
            </div>
          </aside>

          {/* Правая колонка — форма */}
          <main className="w-full lg:w-2/3 bg-white/90 rounded-b-3xl lg:rounded-r-3xl lg:rounded-bl-none shadow-xl border border-gray-100 p-8 flex flex-col justify-center">
            <form onSubmit={handleSubmit} className="space-y-10 w-full mx-auto">
              {/* Название */}
              <div>
                <Label htmlFor="title" className="font-semibold text-gray-800 text-lg">Название подраздела</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Например: Введение или Практика 1"
                  required
                  className="mt-3 text-lg py-4 px-4"
                />
              </div>

              {/* Тип контента */}
              <div>
                <Label htmlFor="type" className="font-semibold text-gray-800 text-lg">Тип контента</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'text' | 'pdf') => handleInputChange('type', value)}
                >
                  <SelectTrigger className="mt-3 text-lg py-4 px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Текст
                      </div>
                    </SelectItem>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <File className="w-5 h-5" />
                        PDF
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Контент или PDF */}
              {formData.type === 'text' ? (
                <div>
                  <Label htmlFor="content" className="font-semibold text-gray-800 text-lg">Содержимое</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Введите текст подраздела..."
                    rows={14}
                    className="mt-3 text-lg py-4 px-4 min-h-[220px]"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="file" className="font-semibold text-gray-800 text-lg">PDF файл</Label>
                  <div className="border-2 border-dashed border-indigo-200 rounded-xl p-10 text-center mt-3 bg-indigo-50/40">
                    <Upload className="w-10 h-10 mx-auto mb-3 text-indigo-400" />
                    <input
                      id="file"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                    <label htmlFor="file" className="cursor-pointer text-indigo-600 hover:text-indigo-800 font-medium text-lg">
                      {formData.file ? 'Выбрать другой PDF' : 'Выберите PDF файл'}
                    </label>
                    {formData.file && (
                      <p className="mt-3 text-base text-gray-600">
                        Выбран файл: {formData.file.name}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Изображения */}
              {formData.type === 'text' && (
                <div>
                  <Label htmlFor="images" className="font-semibold text-gray-800 text-lg">Картинки (PNG, JPG, GIF)</Label>
                  <div className="border-2 border-dashed border-indigo-200 rounded-xl p-6 text-center mt-3 bg-indigo-50/40">
                    <input
                      id="images"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif"
                      multiple
                      onChange={handleImagesChange}
                      className="hidden"
                    />
                    <label htmlFor="images" className="cursor-pointer text-indigo-600 hover:text-indigo-800 font-medium text-lg">
                      {formData.images && formData.images.length > 0 ? 'Выбрать другие изображения' : 'Добавить изображения'}
                    </label>
                    {imagePreviews.length > 0 && (
                      <div className="flex flex-wrap gap-4 justify-center mt-4">
                        {imagePreviews.map((src, idx) => (
                          <img key={idx} src={src} alt="preview" className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow" />
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-gray-400 mt-2">Можно загрузить несколько файлов. Поддерживаются PNG, JPG, GIF.</p>
                  </div>
                </div>
              )}

              {/* Кнопки */}
              <div className="flex flex-col sm:flex-row gap-6 pt-2 w-full">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 w-full sm:w-auto justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:scale-105 transition-all text-lg py-4 px-8"
                >
                  <Save className="w-6 h-6" />
                  {saving ? 'Создание...' : 'Создать подраздел'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="w-full sm:w-auto justify-center text-lg py-4 px-8"
                >
                  Отмена
                </Button>
              </div>

              {error && (
                <div className="text-red-500 text-lg text-center mt-4">
                  {error}
                </div>
              )}
            </form>
          </main>
        </div>
      </div>
    </div>
  );
} 