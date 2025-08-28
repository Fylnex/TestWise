import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Group } from '@/services/groupApi';
import { Trash, AlertTriangle } from 'lucide-react';

interface DeleteGroupModalProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (groupId: number) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

const DeleteGroupModal: React.FC<DeleteGroupModalProps> = ({
  group,
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  error = null,
}) => {
  const handleConfirm = async () => {
    if (!group) return;
    try {
      await onConfirm(group.id);
      onClose();
    } catch (error) {
      console.error("Ошибка при удалении группы:", error);
    }
  };

  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
                     <DialogTitle className="flex items-center gap-2 text-red-600">
             <AlertTriangle className="w-5 h-5" />
             Архивировать группу
           </DialogTitle>
           <DialogDescription className="text-left">
             Вы действительно хотите архивировать группу <strong>"{group.name}"</strong>?
           </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium mb-1">Внимание! Это действие нельзя отменить.</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Группа будет перемещена в архив</li>
                  <li>Все связи со студентами и преподавателями будут сохранены</li>
                  <li>Группу можно будет восстановить позже</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Информация о группе:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Название:</strong> {group.name}</p>
              <p><strong>Годы обучения:</strong> {group.start_year} — {group.end_year}</p>
              {group.description && (
                <p><strong>Описание:</strong> {group.description}</p>
              )}
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm p-3 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
                         {loading ? (
               <>
                 <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                 Архивирование...
               </>
             ) : (
               <>
                 <Trash className="w-4 h-4 mr-2" />
                 Архивировать группу
               </>
             )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteGroupModal;
