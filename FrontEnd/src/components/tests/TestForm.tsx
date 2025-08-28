import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Clock, Target, HelpCircle } from 'lucide-react';
import { TestFormData } from '@/types/test';

interface TestFormProps {
  formData: TestFormData;
  onFormDataChange: (data: TestFormData) => void;
  isEditing?: boolean;
}

const TestForm: React.FC<TestFormProps> = ({ 
  formData, 
  onFormDataChange, 
  isEditing = false 
}) => {
  const handleChange = (field: keyof TestFormData, value: string) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          {isEditing ? 'Редактирование теста' : 'Создание нового теста'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title" className="font-semibold text-sm">
            Название теста *
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Введите название теста"
            required
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="description" className="font-semibold text-sm">
            Описание
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Введите описание теста"
            rows={3}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="type" className="font-semibold text-sm">
            Тип теста *
          </Label>
          <Select
            value={formData.type}
            onValueChange={(value) => handleChange('type', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hinted">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Тест с подсказками
                </div>
              </SelectItem>
              <SelectItem value="section_final">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Финальный тест раздела
                </div>
              </SelectItem>
              <SelectItem value="global_final">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Глобальный финальный тест
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration" className="font-semibold text-sm">
              Длительность (минуты)
            </Label>
            <div className="relative mt-2">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                             <Input
                 id="duration"
                 type="number"
                 value={formData.duration}
                 onChange={(e) => handleChange('duration', e.target.value)}
                 placeholder="10"
                 min="1"
                 max="480"
                 className="pl-10"
               />
            </div>
          </div>

          <div>
            <Label htmlFor="max_attempts" className="font-semibold text-sm">
              Максимум попыток
            </Label>
            <div className="relative mt-2">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                id="max_attempts"
                type="number"
                value={formData.max_attempts}
                onChange={(e) => handleChange('max_attempts', e.target.value)}
                placeholder="Неограниченно"
                min="1"
                max="100"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="completion_percentage" className="font-semibold text-sm">
              Процент для успешного прохождения
            </Label>
            <div className="relative mt-2">
              <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                             <Input
                 id="completion_percentage"
                 type="number"
                 value={formData.completion_percentage}
                 onChange={(e) => handleChange('completion_percentage', e.target.value)}
                 placeholder="80"
                 min="1"
                 max="100"
                 className="pl-10"
               />
            </div>
          </div>

          <div>
            <Label htmlFor="target_questions" className="font-semibold text-sm">
              Количество вопросов в тесте
            </Label>
            <div className="relative mt-2">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                             <Input
                 id="target_questions"
                 type="number"
                 value={formData.target_questions}
                 onChange={(e) => handleChange('target_questions', e.target.value)}
                 placeholder="10"
                 min="1"
                 className="pl-10"
               />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestForm;
