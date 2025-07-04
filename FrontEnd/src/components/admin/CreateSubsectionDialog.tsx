import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { sectionApi } from '@/services/sectionApi';

interface CreateSubsectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: number;
  onSubsectionCreated: () => void;
}

const CreateSubsectionDialog: React.FC<CreateSubsectionDialogProps> = ({
  open,
  onOpenChange,
  sectionId,
  onSubsectionCreated,
}) => {
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<'TEXT' | 'PDF'>('TEXT');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState(0);
  const [subsections, setSubsections] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      // Загружаем существующие подразделы для вычисления order
      sectionApi.getSectionSubsections(sectionId)
        .then((data) => {
          const subs = data.subsections || [];
          setSubsections(subs);
          // order = максимальный + 1
          const maxOrder = subs.length > 0 ? Math.max(...subs.map((s: any) => s.order || 0)) : -1;
          setOrder(maxOrder + 1);
        })
        .catch(() => setOrder(0));
    }
  }, [open, sectionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!title) {
      setError('Название не может быть пустым.');
      setIsSubmitting(false);
      return;
    }

    if (contentType === 'PDF' && !file) {
        setError('Для типа PDF необходимо выбрать файл.');
        setIsSubmitting(false);
        return;
    }

    try {
      if (contentType === 'TEXT') {
        // Отправляем JSON для текстовых подразделов на правильный endpoint
        const data = {
          section_id: sectionId,
          title,
          type: contentType.toUpperCase(),
          order,
          content,
        };
        await sectionApi.createSubsectionJson(data);
      } else if (file) {
        // Для PDF — FormData
        const formData = new FormData();
        formData.append('section_id', String(sectionId));
        formData.append('title', title);
        formData.append('type', contentType);
        formData.append('order', String(order));
        formData.append('file', file);
        await sectionApi.createSubsectionWithFile(formData);
      }
      onOpenChange(false);
      onSubsectionCreated(); // Callback to refresh data
      // Reset form
      setTitle('');
      setContentType('TEXT');
      setContent('');
      setFile(null);
    } catch (err) {
      setError('Не удалось создать подсекцию.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать подсекцию</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Название</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div>
            <Label>Тип контента</Label>
            <RadioGroup value={contentType} onValueChange={(value: 'TEXT' | 'PDF') => setContentType(value)} className="flex gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="TEXT" id="r-text" />
                <Label htmlFor="r-text">Текст</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PDF" id="r-pdf" />
                <Label htmlFor="r-pdf">PDF</Label>
              </div>
            </RadioGroup>
          </div>

          {contentType === 'TEXT' ? (
            <div>
              <Label htmlFor="content">Содержимое</Label>
              <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} />
            </div>
          ) : (
            <div>
              <Label htmlFor="file">PDF Файл</Label>
              <Input id="file" type="file" accept=".pdf" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} required />
            </div>
          )}
          
          {error && <p className="text-sm text-red-500">{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Отмена</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSubsectionDialog; 