import React, { useEffect, useState } from 'react';
import { groupApi, Group } from '@/services/groupApi';
import { userApi, User } from '@/services/userApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import GroupCard from '@/components/admin/GroupCard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trash, Pencil, Plus, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const AdminGroupsTab: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', start_year: '', end_year: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [assignGroupId, setAssignGroupId] = useState<number | null>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [groupModal, setGroupModal] = useState<Group | null>(null);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', start_year: '', end_year: '', description: '' });
  const [studentToAdd, setStudentToAdd] = useState('');
  const [students, setStudents] = useState<User[]>([]);
  const [groupTeachers, setGroupTeachers] = useState<User[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedGroupsToDelete, setSelectedGroupsToDelete] = useState<number[]>([]);

  useEffect(() => {
    const demoTeacher = { id: 9001, full_name: 'Павел Сергеевич', patronymic: 'Демонов', username: 'teacher0001' };
    const demoGroup = {
      id: -1,
      name: 'Демонстрационная группа',
      start_year: 2023,
      end_year: 2024,
      description: 'Группа для примера. Назначьте сюда преподавателя через панель администратора.',
      is_archived: false,
      demo_students: [
        { id: 10001, full_name: 'Иван Иванов', patronymic: 'Петрович', username: 'student0001' },
        { id: 10002, full_name: 'Мария Петрова', patronymic: 'Ивановна', username: 'student0002' },
        { id: 10003, full_name: 'Демо-студент', patronymic: 'Тестовый', username: 'student0003' },
      ],
      demo_teacher: demoTeacher,
    };
    groupApi.getGroups()
      .then(res => {
        if (!res.some(g => g.id === -1)) {
          setGroups([demoGroup, ...res]);
        } else {
          setGroups(res);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    userApi.getAllUsers({ role: 'teacher' }).then(setTeachers);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      if (Number(form.start_year) < 0 || Number(form.end_year) < 0) {
        setError('Годы не могут быть отрицательными');
        setCreating(false);
        return;
      }
      const newGroup = await groupApi.createGroup({
        ...form,
        start_year: Number(form.start_year),
        end_year: Number(form.end_year),
      });
      setGroups(prev => [...prev, newGroup]);
      setForm({ name: '', start_year: '', end_year: '', description: '' });
      setOpen(false);
    } catch (err) {
      setError('Ошибка при создании группы');
    } finally {
      setCreating(false);
    }
  };

  const handleAssignTeacher = async () => {
    if (!assignGroupId || !selectedTeacher) return;
    setAssigning(true);
    setAssignError(null);
    try {
      await groupApi.addGroupTeachers(assignGroupId, [selectedTeacher]);
      setAssignGroupId(null);
      setSelectedTeacher(null);
      // Можно обновить группы или показать уведомление
    } catch (e) {
      setAssignError('Ошибка при назначении преподавателя');
    } finally {
      setAssigning(false);
    }
  };

  const openGroupModal = async (group: Group) => {
    setGroupModal(group);
    setEditMode(false);
    setEditForm({
      name: group.name,
      start_year: String(group.start_year),
      end_year: String(group.end_year),
      description: group.description || '',
    });
    if (group.id > 0) {
      const [studs, teachers] = await Promise.all([
        groupApi.getGroupStudents(group.id).then(arr => arr.map(s => s.user_id)),
        groupApi.getGroupTeachers(group.id).then(arr => arr.map(t => t.user_id)),
      ]);
      const allUsers = await userApi.getAllUsers();
      setStudents(allUsers.filter(u => studs.includes(u.id)));
      setGroupTeachers(allUsers.filter(u => teachers.includes(u.id)));
    } else {
      setStudents([]);
      setGroupTeachers([]);
    }
  };

  function getInitials(fullName: string) {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0][0] || '';
    return (parts[0][0] || '') + (parts[1][0] || '');
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Группы</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Создать группу</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать новую группу</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Название группы"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Год начала"
                type="number"
                min="0"
                value={form.start_year}
                onChange={e => setForm(f => ({ ...f, start_year: e.target.value }))}
                required
              />
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Год окончания"
                type="number"
                min="0"
                value={form.end_year}
                onChange={e => setForm(f => ({ ...f, end_year: e.target.value }))}
                required
              />
              <textarea
                className="w-full border rounded px-3 py-2"
                placeholder="Описание группы (необязательно)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Создание...' : 'Создать'}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Отмена</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Список групп</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10">Загрузка...</div>
            ) : groups.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">Нет групп</div>
            ) : (
              groups.map((group) => (
                <GroupCard
                  key={group.id}
                  name={group.name}
                  start_year={group.start_year}
                  end_year={group.end_year}
                  description={group.description}
                  isDemo={group.id === -1}
                  onClick={() => openGroupModal(group)}
                  onAssignTeacher={group.id > 0 ? () => setAssignGroupId(group.id) : undefined}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Демонстрационная группа — Студенты и преподаватель</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div><b>Название:</b> Демонстрационная группа</div>
            <div><b>Годы:</b> 2023–2024</div>
            <div><b>Описание:</b> Группа для примера. Назначьте сюда преподавателя через панель администратора.</div>
            <div><b>Преподаватель:</b> Павел Сергеевич Демонов (teacher0001)</div>
            <div><b>Студенты:</b></div>
            <table className="w-full border mt-2">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-left">ФИО</th>
                  <th className="p-2 text-left">Логин</th>
                </tr>
              </thead>
              <tbody>
                {groups.find(g => g.id === -1)?.demo_students?.map(s => (
                  <tr key={s.id}>
                    <td className="p-2">{s.full_name} {s.patronymic}</td>
                    <td className="p-2">{s.username}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Закрыть</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={assignGroupId !== null} onOpenChange={() => setAssignGroupId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначить преподавателя</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Выберите преподавателя, чтобы назначить его на группу "{groups.find(g => g.id === assignGroupId)?.name}".</p>
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Поиск по ФИО преподавателя..."
                value={teacherSearch}
                onChange={e => setTeacherSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto border rounded-md">
              {teachers
                .filter(t => t.full_name.toLowerCase().includes(teacherSearch.toLowerCase()))
                .map(t => (
                <div
                  key={t.id}
                  className={`p-2 cursor-pointer hover:bg-muted ${selectedTeacher === t.id ? 'bg-primary text-primary-foreground' : ''}`}
                  onClick={() => setSelectedTeacher(t.id)}
                >
                  {t.full_name}
                </div>
              ))}
            </div>
            {assignError && <div className="text-red-500 text-sm">{assignError}</div>}
          </div>
          <DialogFooter>
            <Button onClick={handleAssignTeacher} disabled={assigning || !selectedTeacher}>
              {assigning ? 'Назначение...' : 'Назначить'}
            </Button>
            <Button variant="outline" onClick={() => setAssignGroupId(null)}>Отмена</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!groupModal} onOpenChange={v => { if (!v) setGroupModal(null); }}>
        <DialogContent className="max-w-5xl w-full min-h-[9vh] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-4 flex items-center justify-between">
              {editMode ? (
                <input className="text-xl font-bold border-b-2 focus:outline-none" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              ) : (
                <span>{groupModal?.name}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section>
              <h3 className="font-semibold text-lg mb-2">Информация о группе</h3>
              <div className="mb-2"><b>Годы:</b> {editMode ? (<><input className="border rounded px-2 py-1 w-20 mr-2" type="number" value={editForm.start_year} onChange={e => setEditForm(f => ({ ...f, start_year: e.target.value }))} /> — <input className="border rounded px-2 py-1 w-20 ml-2" type="number" value={editForm.end_year} onChange={e => setEditForm(f => ({ ...f, end_year: e.target.value }))} /></>) : (`${groupModal?.start_year}–${groupModal?.end_year}`)}</div>
              <div className="mb-2"><b>Описание:</b> {editMode ? (<textarea className="border rounded px-2 py-1 w-full" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />) : (groupModal?.description)}</div>
            </section>
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">Преподаватели</h3>
                <Button onClick={() => setAssignGroupId(groupModal?.id ?? 0)} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />Добавить преподавателя</Button>
              </div>
              <ul className="max-h-40 overflow-y-auto border rounded p-2 bg-muted/30 divide-y">
                {groupTeachers.map(t => (
                  <li key={t.id} className="flex items-center justify-between py-2 gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarFallback>{getInitials(t.full_name)}</AvatarFallback>
                      </Avatar>
                      <span>{t.full_name}{t.patronymic ? ` ${t.patronymic}` : ''} <span className="text-muted-foreground">({t.username})</span></span>
                    </div>
                    <Button size="icon" variant="destructive" title="Удалить преподавателя" onClick={/* TODO: удалить преподавателя */() => {}}><Trash className="w-4 h-4" /></Button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <section className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">Студенты</h3>
              <Button onClick={/* TODO: добавить студента */() => {}} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />Добавить студента</Button>
            </div>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input className="border rounded pl-8 pr-2 py-1 w-full" placeholder="Поиск по ФИО или логину" value={studentToAdd} onChange={e => setStudentToAdd(e.target.value)} />
            </div>
            <ul className="max-h-40 overflow-y-auto border rounded p-2 bg-muted/30 divide-y">
              {students.filter(s => (s.full_name + ' ' + (s.patronymic || '') + ' ' + s.username).toLowerCase().includes(studentToAdd.toLowerCase())).map(s => (
                <li key={s.id} className="flex items-center justify-between py-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>{getInitials(s.full_name)}</AvatarFallback>
                    </Avatar>
                    <span>{s.full_name}{s.patronymic ? ` ${s.patronymic}` : ''} <span className="text-muted-foreground">({s.username})</span></span>
                  </div>
                  <Button size="icon" variant="destructive" title="Удалить студента" onClick={/* TODO: удалить студента */() => {}}><Trash className="w-4 h-4" /></Button>
                </li>
              ))}
            </ul>
          </section>
          <DialogFooter className="flex justify-end p-0">
            {!editMode && (
              <Button onClick={() => setEditMode(true)} variant="secondary" size="sm"><Pencil className="w-4 h-4 mr-1" />Редактировать</Button>
            )}
            {editMode && (
              <>
                <Button onClick={/* TODO: handleSaveEdit */() => setEditMode(false)} variant="default" size="sm" className="mr-2">Сохранить</Button>
                <Button onClick={() => setEditMode(false)} variant="outline" size="sm">Отмена</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DialogFooter className="flex justify-end p-0 mt-4">
        <Button onClick={() => setDeleteModalOpen(true)} variant="destructive" size="sm">
          <Trash className="w-4 h-4 mr-1" />Удалить
        </Button>
      </DialogFooter>
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Удаление групп</DialogTitle>
          </DialogHeader>
          <div className="mb-4">Выберите группы, которые хотите удалить:</div>
          <ul className="max-h-60 overflow-y-auto border rounded p-2 bg-muted/30 divide-y">
            {groups.map(g => (
              <li key={g.id} className="flex items-center gap-2 py-2">
                <Checkbox
                  checked={selectedGroupsToDelete.includes(g.id)}
                  onCheckedChange={v => {
                    setSelectedGroupsToDelete(prev => v ? [...prev, g.id] : prev.filter(id => id !== g.id));
                  }}
                  id={`delete-group-${g.id}`}
                />
                <label htmlFor={`delete-group-${g.id}`}>{g.name} ({g.start_year}–{g.end_year})</label>
              </li>
            ))}
          </ul>
          <DialogFooter className="flex justify-end">
            <Button
              variant="destructive"
              disabled={selectedGroupsToDelete.length === 0}
              onClick={async () => {
                // TODO: реализовать удаление через groupApi.deleteGroupPermanently
                setDeleteModalOpen(false);
                setSelectedGroupsToDelete([]);
              }}
            >Удалить выбранные</Button>
            <DialogClose asChild>
              <Button variant="outline">Отмена</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGroupsTab; 