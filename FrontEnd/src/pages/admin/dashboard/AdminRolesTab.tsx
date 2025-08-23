import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash } from 'lucide-react';

const permissionGroups = [
  {
    label: 'Пользователи',
    options: [
      'Управление пользователями',
      'Просмотр студентов',
      'Просмотр своих данных',
      'Массовое добавление пользователей',
      'Управление ролями',
      'Управление доступом',
    ],
  },
  {
    label: 'Тесты и вопросы',
    options: [
      'Управление тестами',
      'Управление вопросами',
      'Прохождение тестов',
      'Просмотр статистики по тестам',
      'Управление сертификатами',
    ],
  },
  {
    label: 'Контент и структура',
    options: [
      'Управление группами',
      'Управление темами и разделами',
      'Массовое добавление групп',
      'Архивация тем',
      'Восстановление тем',
      'Удаление тем',
      'Управление файлами и медиа',
      'Управление расписанием',
    ],
  },
  {
    label: 'Аналитика',
    options: [
      'Просмотр и аналитика',
      'Экспорт данных',
      'Импорт данных',
      'Просмотр логов',
      'Просмотр истории изменений',
    ],
  },
];

const defaultRoles = [
  {
    name: 'Администратор',
    code: 'admin',
    permissions: [
      'Управление пользователями',
      'Просмотр студентов',
      'Просмотр своих данных',
      'Массовое добавление пользователей',
      'Управление ролями',
      'Управление доступом',
      'Управление тестами',
      'Управление вопросами',
      'Прохождение тестов',
      'Просмотр статистики по тестам',
      'Управление сертификатами',
      'Управление группами',
      'Управление темами и разделами',
      'Массовое добавление групп',
      'Архивация тем',
      'Восстановление тем',
      'Удаление тем',
      'Управление файлами и медиа',
      'Управление расписанием',
      'Просмотр и аналитика',
      'Экспорт данных',
      'Импорт данных',
      'Просмотр логов',
      'Просмотр истории изменений',
    ],
  },
  {
    name: 'Преподаватель',
    code: 'teacher',
    permissions: [
      'Управление тестами',
      'Управление вопросами',
      'Просмотр студентов',
      'Просмотр и аналитика',
      'Массовое добавление пользователей',
      'Массовое добавление групп',
      'Управление группами',
      'Управление сертификатами',
      'Управление расписанием',
      'Просмотр статистики по тестам',
    ],
  },
  {
    name: 'Студент',
    code: 'student',
    permissions: [
      'Прохождение тестов',
      'Просмотр своих данных',
      'Просмотр вопросов',
      'Просмотр материалов тем и разделов',
      'Просмотр и аналитика',
    ],
  },
];

const AdminRolesTab: React.FC = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [newRole, setNewRole] = useState({ name: '', code: '', permissions: [] as string[] });
  const [localRoles, setLocalRoles] = useState(defaultRoles);

  const handleCreate = () => {
    if (!newRole.name || !newRole.code || newRole.permissions.length === 0) return;
    setLocalRoles(prev => [...prev, { ...newRole }]);
    setCreateOpen(false);
    setNewRole({ name: '', code: '', permissions: [] });
  };

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setNewRole({ ...localRoles[idx] });
    setEditOpen(true);
  };

  const handleEditSave = () => {
    if (editIdx === null) return;
    setLocalRoles(prev => prev.map((r, i) => i === editIdx ? { ...newRole } : r));
    setEditOpen(false);
    setEditIdx(null);
    setNewRole({ name: '', code: '', permissions: [] });
  };

  const handleDelete = (idx: number) => {
    setLocalRoles(prev => prev.filter((_, i) => i !== idx));
  };

  return (
          <div className="max-w-[1000px] mx-auto px-6 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Роли</h2>
        <Button variant="outline" onClick={() => {
          setNewRole({ name: '', code: '', permissions: [] });
          setCreateOpen(true);
        }}>Создать новую роль</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Список ролей и их права</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-left">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 font-semibold">Роль</th>
                  <th className="p-2 font-semibold">Права</th>
                  <th className="p-2 font-semibold text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {localRoles.map((role, idx) => (
                  <tr key={role.code} className="border-b">
                    <td className="p-2 font-medium">{role.name}</td>
                    <td className="p-2">{role.permissions.join(', ')}</td>
                    <td className="p-2 flex gap-2 justify-end">
                      {role.code !== 'admin' && (
                        <>
                          <Button size="icon" variant="outline" onClick={() => handleEdit(idx)} title="Редактировать">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="destructive" onClick={() => handleDelete(idx)} title="Удалить">
                            <Trash className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* Модалка создания роли */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open);
        if (!open) setNewRole({ name: '', code: '', permissions: [] });
      }}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Создать новую роль</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Название роли (например, Модератор)"
              value={newRole.name}
              onChange={e => setNewRole(r => ({ ...r, name: e.target.value }))}
              required
            />
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Код роли (латиницей, например, moderator)"
              value={newRole.code}
              onChange={e => setNewRole(r => ({ ...r, code: e.target.value }))}
              required
            />
            <div>
              <div className="mb-2 font-semibold">Права:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {permissionGroups.map(group => (
                  <div key={group.label}>
                    <div className="font-medium mb-1 text-sm text-muted-foreground">{group.label}</div>
                    {group.options.map(option => (
                      <label key={option} className="flex items-center gap-2 mb-1">
                        <Checkbox
                          checked={newRole.permissions.includes(option)}
                          onCheckedChange={v => {
                            setNewRole(r => v
                              ? { ...r, permissions: [...r.permissions, option] }
                              : { ...r, permissions: r.permissions.filter(p => p !== option) }
                            );
                          }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end">
            <Button onClick={handleCreate} disabled={!newRole.name || !newRole.code || newRole.permissions.length === 0}>
              Создать
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Отмена</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Модалка редактирования роли */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Редактировать роль</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Название роли"
              value={newRole.name}
              onChange={e => setNewRole(r => ({ ...r, name: e.target.value }))}
              required
            />
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Код роли (латиницей)"
              value={newRole.code}
              onChange={e => setNewRole(r => ({ ...r, code: e.target.value }))}
              required
            />
            <div>
              <div className="mb-2 font-semibold">Права:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {permissionGroups.map(group => (
                  <div key={group.label}>
                    <div className="font-medium mb-1 text-sm text-muted-foreground">{group.label}</div>
                    {group.options.map(option => (
                      <label key={option} className="flex items-center gap-2 mb-1">
                        <Checkbox
                          checked={newRole.permissions.includes(option)}
                          onCheckedChange={v => {
                            setNewRole(r => v
                              ? { ...r, permissions: [...r.permissions, option] }
                              : { ...r, permissions: r.permissions.filter(p => p !== option) }
                            );
                          }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end">
            <Button onClick={handleEditSave} disabled={!newRole.name || !newRole.code || newRole.permissions.length === 0}>
              Сохранить
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Отмена</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRolesTab; 