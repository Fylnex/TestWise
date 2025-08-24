import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Group } from '@/services/groupApi';
import { Pencil } from 'lucide-react';

interface EditGroupModalProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (groupId: number, data: EditGroupFormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export interface EditGroupFormData {
  name: string;
  start_year: string;
  end_year: string;
  description: string;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({
  group,
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error = null,
}) => {
  const [form, setForm] = useState<EditGroupFormData>({
    name: '',
    start_year: '',
    end_year: '',
    description: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Обновляем форму при изменении группы
  useEffect(() => {
    if (group) {
      setForm({
        name: group.name,
        start_year: group.start_year.toString(),
        end_year: group.end_year.toString(),
        description: group.description || '',
      });
      setFormError(null);
    }
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!group) return;
    
    // Валидация
    if (!form.name.trim() || !form.start_year || !form.end_year) {
      setFormError("Все поля обязательны для заполнения");
      return;
    }
    
    if (Number(form.start_year) >= Number(form.end_year)) {
      setFormError("Год окончания должен быть больше года начала");
      return;
    }
    
    try {
      await onSubmit(group.id, form);
      // handleClose() будет вызван в onSubmit после успешного обновления
    } catch (error) {
      console.error("Ошибка при редактировании группы:", error);
      setFormError("Ошибка при редактировании группы");
    }
  };

  const handleClose = () => {
    setForm({
      name: '',
      start_year: '',
      end_year: '',
      description: '',
    });
    setFormError(null);
    onClose();
  };

  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать группу</DialogTitle>
          <DialogDescription>
            Измените данные группы. После сохранения изменения будут применены.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Название группы</label>
            <Input
              placeholder="Введите название группы"
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
            <label className="block text-sm font-medium">Описание группы</label>
            <Textarea
              placeholder="Описание группы (необязательно)"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[80px]"
            />
          </div>
          
          {(error || formError) && (
            <div className="text-red-500 text-sm p-2 bg-red-50 border border-red-200 rounded">
              {formError || error}
            </div>
          )}
          
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Сохранить
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

export default EditGroupModal;
