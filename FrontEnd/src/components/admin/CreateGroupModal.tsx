import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: CreateGroupFormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export interface CreateGroupFormData {
  name: string;
  start_year: string;
  end_year: string;
  description: string;
  student_count: string;
  file: File | null;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error = null,
}) => {
  const [form, setForm] = useState<CreateGroupFormData>({
    name: '',
    start_year: '',
    end_year: '',
    description: '',
    student_count: '',
    file: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
    // Не очищаем форму здесь, так как это может быть сделано в родительском компоненте
  };

  const handleClose = () => {
    // Очищаем форму при закрытии
    setForm({
      name: '',
      start_year: '',
      end_year: '',
      description: '',
      student_count: '',
      file: null,
    });
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm(prev => ({ ...prev, file }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать новую группу</DialogTitle>
          <DialogDescription>
            Введите данные для новой группы.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Название группы</label>
            <Input
              placeholder="Название группы"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Год начала</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.start_year}
                onChange={(e) => setForm(prev => ({ ...prev, start_year: e.target.value }))}
                required
              >
                <option value="">Выберите год</option>
                {Array.from({ length: 81 }, (_, i) => 2020 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Год окончания</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.end_year}
                onChange={(e) => setForm(prev => ({ ...prev, end_year: e.target.value }))}
                required
              >
                <option value="">Выберите год</option>
                {Array.from({ length: 81 }, (_, i) => 2020 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Количество студентов</label>
            <Input
              type="number"
              min="0"
              placeholder="Количество студентов (для генерации логинов)"
              value={form.student_count}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || Number(val) >= 0) {
                  setForm(prev => ({ ...prev, student_count: val }));
                }
              }}
              disabled={!!form.file}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Загрузить файл</label>
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
            />
            {form.file && (
              <div className="text-xs text-muted-foreground mt-1">
                Файл: {form.file.name}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Описание группы</label>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[80px]"
              placeholder="Описание группы (необязательно)"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm p-2 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}
          
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Создание...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать
                </>
              )}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>
                Отмена
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;
