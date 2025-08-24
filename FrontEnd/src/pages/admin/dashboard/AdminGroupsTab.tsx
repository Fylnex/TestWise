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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import GroupCard from '@/components/admin/GroupCard';
import GroupModal from '@/components/admin/GroupModal';
import { Trash, Pencil, Plus, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const AdminGroupsTab: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', start_year: '', end_year: '', description: '', student_count: '', file: null as File | null });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [assignGroupId, setAssignGroupId] = useState<number | null>(null);
  const [assignStudentId, setAssignStudentId] = useState<number | null>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [removingTeacher, setRemovingTeacher] = useState<number | null>(null);
  const [removingStudent, setRemovingStudent] = useState<number | null>(null);
  const [groupModal, setGroupModal] = useState<Group | null>(null);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState<User[]>([]);
  const [groupTeachers, setGroupTeachers] = useState<User[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedGroupsToDelete, setSelectedGroupsToDelete] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingSingleGroup, setDeletingSingleGroup] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editForm, setEditForm] = useState({ name: '', start_year: '', end_year: '', description: '' });
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    groupApi.getGroups()
      .then(setGroups)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    userApi.getAllUsers({ role: 'teacher' }).then(setTeachers);
    userApi.getAllUsers({ role: 'student' }).then(setAllStudents);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    
    // Проверяем обязательные поля
    if (!form.name.trim() || !form.start_year || !form.end_year) {
      setError("Все поля обязательны для заполнения");
      setCreating(false);
      return;
    }
    
    try {
      if (Number(form.start_year) < 0 || Number(form.end_year) < 0) {
        setError('Годы не могут быть отрицательными');
        setCreating(false);
        return;
      }
      
      if (Number(form.start_year) >= Number(form.end_year)) {
        setError("Год окончания должен быть больше года начала");
        setCreating(false);
        return;
      }
      
      if (form.student_count && Number(form.student_count) < 1) {
        setError("Количество студентов должно быть не менее 1");
        setCreating(false);
        return;
      }
      
      if (form.file) {
        // Если загружен файл, используем API для загрузки файла
        setUploadingFile(true);
        try {
          const formData = new FormData();
          formData.append("name", form.name);
          formData.append("start_year", form.start_year);
          formData.append("end_year", form.end_year);
          formData.append("description", form.description);
          formData.append("file", form.file);
          
          const response = await fetch("/api/groups/upload", {
            method: "POST",
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Ошибка загрузки файла: ${response.status} ${response.statusText}`);
          }
          
          // Обновляем список групп после загрузки файла
          const updatedGroups = await groupApi.getGroups();
          setGroups(updatedGroups);
        } finally {
          setUploadingFile(false);
        }
      } else {
        // Создаем группу обычным способом
        const newGroup = await groupApi.createGroup({
          ...form,
          start_year: Number(form.start_year),
          end_year: Number(form.end_year),
        });
        
        setGroups(prev => [...prev, newGroup]);
      }
      
      setForm({ name: '', start_year: '', end_year: '', description: '', student_count: '', file: null });
      setOpen(false);
      setUploadingFile(false);
      
      // Показываем уведомление об успехе
      // Здесь можно добавить toast уведомление
    } catch (err: any) {
      console.error("Ошибка при создании группы:", err);
      
      if (err.response?.status === 403) {
        setError("У вас нет прав для создания группы");
      } else if (err.response?.status === 401) {
        setError("Необходимо авторизоваться");
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Ошибка при создании группы. Проверьте введенные данные.");
      }
    } finally {
      setCreating(false);
      setUploadingFile(false);
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
      
      // Обновляем список преподавателей в группе
      if (groupModal && groupModal.id === assignGroupId) {
        const teachers = await groupApi.getGroupTeachers(groupModal.id);
        const allUsers = await userApi.getAllUsers();
        setGroupTeachers(allUsers.filter(u => teachers.map(t => t.user_id).includes(u.id)));
      }
      
      // Можно обновить группы или показать уведомление
    } catch (e) {
      setAssignError('Ошибка при назначении преподавателя');
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignStudent = async () => {
    if (!assignStudentId || !selectedStudent) return;
    setAssigning(true);
    setAssignError(null);
    try {
      await groupApi.addGroupStudents(assignStudentId, [selectedStudent]);
      setAssignStudentId(null);
      setSelectedStudent(null);
      
      // Обновляем список студентов в группе
      if (groupModal && groupModal.id === assignStudentId) {
        const studs = await groupApi.getGroupStudents(groupModal.id);
        const allUsers = await userApi.getAllUsers();
        setStudents(allUsers.filter(u => studs.map(s => s.user_id).includes(u.id)));
      }
    } catch (e) {
      setAssignError('Ошибка при добавлении студента');
    } finally {
      setAssigning(false);
    }
  };

  const openGroupModal = async (group: Group) => {
    setGroupModal(group);
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



  const handleDeleteGroups = async () => {
    if (selectedGroupsToDelete.length === 0) return;
    
    setDeleting(true);
    setDeleteError(null);
    
    try {
      // Удаляем каждую выбранную группу
      await Promise.all(
        selectedGroupsToDelete.map(async (groupId) => {
          try {
            await groupApi.deleteGroupPermanently(groupId);
          } catch (error) {
            console.error(`Ошибка при удалении группы ${groupId}:`, error);
            throw error;
          }
        })
      );
      
      // Сначала обновляем локальное состояние для быстрого отклика
      setGroups(prevGroups => prevGroups.filter(g => !selectedGroupsToDelete.includes(g.id)));
      
      // Затем обновляем список групп с сервера для синхронизации
      try {
        const updatedGroups = await groupApi.getGroups();
        setGroups(updatedGroups);
      } catch (refreshError) {
        console.warn("Не удалось обновить список групп с сервера:", refreshError);
        // Если не удалось обновить с сервера, оставляем локальное обновление
      }
      
      // Закрываем модальное окно и очищаем выбранные группы
      setDeleteModalOpen(false);
      setSelectedGroupsToDelete([]);
      
      // Показываем уведомление об успехе
      // Здесь можно добавить toast уведомление
    } catch (error: any) {
      console.error("Ошибка при удалении групп:", error);
      
      if (error.response?.status === 403) {
        setDeleteError("У вас нет прав для удаления групп");
      } else if (error.response?.status === 401) {
        setDeleteError("Необходимо авторизоваться");
      } else if (error.response?.status === 404) {
        setDeleteError("Одна или несколько групп не найдены или уже удалены");
      } else if (error.response?.data?.detail) {
        setDeleteError(error.response.data.detail);
      } else {
        setDeleteError("Ошибка при удалении групп. Попробуйте еще раз.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSingleGroup = async (groupId: number) => {
    if (!confirm(`Вы уверены, что хотите удалить группу "${groups.find(g => g.id === groupId)?.name}"? Это действие нельзя отменить.`)) {
      return;
    }
    
    setDeletingSingleGroup(groupId);
    
    try {
      await groupApi.deleteGroupPermanently(groupId);
      
      // Сначала обновляем локальное состояние для быстрого отклика
      setGroups(prevGroups => prevGroups.filter(g => g.id !== groupId));
      
      // Затем обновляем список групп с сервера для синхронизации
      try {
        const updatedGroups = await groupApi.getGroups();
        setGroups(updatedGroups);
      } catch (refreshError) {
        console.warn("Не удалось обновить список групп с сервера:", refreshError);
        // Если не удалось обновить с сервера, оставляем локальное обновление
      }
      
      // Закрываем модальное окно группы
      setGroupModal(null);
      
      // Показываем уведомление об успехе
      // Здесь можно добавить toast уведомление
    } catch (error: any) {
      console.error("Ошибка при удалении группы:", error);
      
      let errorMessage = "Ошибка при удалении группы";
      if (error.response?.status === 403) {
        errorMessage = "У вас нет прав для удаления группы";
      } else if (error.response?.status === 401) {
        errorMessage = "Необходимо авторизоваться";
      } else if (error.response?.status === 404) {
        errorMessage = "Группа не найдена или уже удалена";
        // Если группа не найдена, убираем её из локального состояния
        setGroups(prevGroups => prevGroups.filter(g => g.id !== groupId));
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      alert(errorMessage);
    } finally {
      setDeletingSingleGroup(null);
    }
  };



  const refreshGroups = async () => {
    try {
      setLoading(true);
      const updatedGroups = await groupApi.getGroups();
      setGroups(updatedGroups);
    } catch (error) {
      console.error("Ошибка при обновлении списка групп:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditGroup = async (groupId: number, data: any) => {
    try {
      // TODO: Реализовать API для обновления группы
      console.log('Редактирование группы:', groupId, data);
      
      // Обновляем локальное состояние
      setGroups(prevGroups => 
        prevGroups.map(g => 
          g.id === groupId 
            ? { ...g, ...data, start_year: Number(data.start_year), end_year: Number(data.end_year) }
            : g
        )
      );
      
      // Если модальное окно группы открыто, обновляем данные группы
      if (groupModal && groupModal.id === groupId) {
        setGroupModal(prev => prev ? { ...prev, ...data, start_year: Number(data.start_year), end_year: Number(data.end_year) } : null);
      }
      
      // Закрываем модальное окно редактирования
      setEditModalOpen(false);
      setEditingGroup(null);
      setEditForm({ name: '', start_year: '', end_year: '', description: '' });
    } catch (error) {
      console.error("Ошибка при редактировании группы:", error);
      throw error;
    }
  };

  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setEditForm({
      name: group.name,
      start_year: group.start_year.toString(),
      end_year: group.end_year.toString(),
      description: group.description || ''
    });
    setEditModalOpen(true);
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    
    setEditing(true);
    setEditError(null);
    
    try {
      // Проверяем обязательные поля
      if (!editForm.name.trim() || !editForm.start_year || !editForm.end_year) {
        setEditError("Все поля обязательны для заполнения");
        return;
      }
      
      if (Number(editForm.start_year) >= Number(editForm.end_year)) {
        setEditError("Год окончания должен быть больше года начала");
        return;
      }
      
      // Обновляем группу
      await handleEditGroup(editingGroup.id, editForm);
      
      // Закрываем модальное окно
      setEditModalOpen(false);
      setEditingGroup(null);
      setEditForm({ name: '', start_year: '', end_year: '', description: '' });
      
    } catch (error) {
      console.error("Ошибка при редактировании группы:", error);
      setEditError("Ошибка при редактировании группы");
    } finally {
      setEditing(false);
    }
  };

  const handleRemoveTeacher = async (groupId: number, teacherId: number) => {
    if (!confirm('Вы уверены, что хотите удалить преподавателя из группы?')) {
      return;
    }
    
    setRemovingTeacher(teacherId);
    
    try {
      // Используем API для удаления преподавателя из группы
      await groupApi.removeGroupTeacher(groupId, teacherId);
      
      // Обновляем локальное состояние
      setGroupTeachers(prevTeachers => prevTeachers.filter(t => t.id !== teacherId));
      
      // Если модальное окно группы открыто, обновляем данные группы
      if (groupModal && groupModal.id === groupId) {
        // Перезагружаем преподавателей группы
        const teachers = await groupApi.getGroupTeachers(groupId);
        const allUsers = await userApi.getAllUsers();
        setGroupTeachers(allUsers.filter(u => teachers.map(t => t.user_id).includes(u.id)));
      }
      
      // Показываем уведомление об успехе
      // Здесь можно добавить toast уведомление
    } catch (error) {
      console.error("Ошибка при удалении преподавателя из группы:", error);
      alert("Ошибка при удалении преподавателя из группы");
    } finally {
      setRemovingTeacher(null);
    }
  };

  const handleRemoveStudent = async (groupId: number, studentId: number) => {
    if (!confirm('Вы уверены, что хотите удалить студента из группы?')) {
      return;
    }
    
    setRemovingStudent(studentId);
    
    try {
      // Используем API для удаления студента из группы
      await groupApi.removeGroupStudent(groupId, studentId);
      
      // Обновляем локальное состояние
      setStudents(prevStudents => prevStudents.filter(s => s.id !== studentId));
      
      // Если модальное окно группы открыто, обновляем данные группы
      if (groupModal && groupModal.id === groupId) {
        // Перезагружаем студентов группы
        const students = await groupApi.getGroupStudents(groupId);
        const allUsers = await userApi.getAllUsers();
        setStudents(allUsers.filter(u => students.map(s => s.user_id).includes(u.id)));
      }
      
      // Показываем уведомление об успехе
      // Здесь можно добавить toast уведомление
    } catch (error) {
      console.error("Ошибка при удалении студента из группы:", error);
      alert("Ошибка при удалении студента из группы");
    } finally {
      setRemovingStudent(null);
    }
  };

    return (
          <div className="max-w-[1000px] mx-auto px-6 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Группы</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshGroups}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Обновление...
              </>
            ) : (
              "Обновить список"
            )}
          </Button>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              // Сбрасываем форму при закрытии диалога
              setForm({ name: '', start_year: '', end_year: '', description: '', student_count: '', file: null });
              setError(null);
              setUploadingFile(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">Создать группу</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать новую группу</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Введите данные для новой группы. После создания вы сможете назначить преподавателей и добавить студентов.
                </p>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Название группы</label>
                  <Input
                    placeholder="Введите название группы"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                 
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Год начала</label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={form.start_year}
                      onChange={e => setForm(f => ({ ...f, start_year: e.target.value }))}
                      required
                    >
                      <option value="">Выберите год</option>
                      {Array.from({ length: 81 }, (_, i) => 2020 + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Год окончания</label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={form.end_year}
                      onChange={e => setForm(f => ({ ...f, end_year: e.target.value }))}
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
                  <label className="text-sm font-medium">Описание группы</label>
                  <Textarea
                    placeholder="Описание группы (необязательно)"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="min-h-[80px]"
                  />
                </div>
                 
                <div className="space-y-2">
                  <label className="text-sm font-medium">Количество студентов (опционально)</label>
                  <Input
                    placeholder="Количество студентов для генерации логинов"
                    type="number"
                    min="0"
                    value={form.student_count || ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "" || Number(val) >= 0)
                        setForm(f => ({ ...f, student_count: val }));
                    }}
                    disabled={!!form.file}
                  />
                  <p className="text-xs text-muted-foreground">
                    {form.file 
                      ? "Количество студентов будет определено из файла" 
                      : "Укажите количество студентов, если хотите автоматически сгенерировать логины"
                    }
                  </p>
                </div>
                 
                <div className="space-y-2">
                  <label className="text-sm font-medium">Загрузить файл (опционально)</label>
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setForm(f => ({ ...f, file }));
                      }
                    }}
                  />
                  {form.file && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                      <span>Выбран файл: {form.file.name}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setForm(f => ({ ...f, file: null }))}
                      >
                        Убрать файл
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Загрузите файл со списком студентов для автоматического создания группы
                  </p>
                </div>
                {error && <div className="text-red-500 text-sm">{error}</div>}
                <DialogFooter>
                  <Button type="submit" disabled={creating || uploadingFile}>
                    {creating || uploadingFile ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        {uploadingFile ? "Загрузка файла..." : "Создание..."}
                      </>
                    ) : (
                      "Создать"
                    )}
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Отмена</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
                <div key={group.id} className="relative">
                  <GroupCard
                    name={group.name}
                    start_year={group.start_year}
                    end_year={group.end_year}
                    description={group.description}
                    onClick={() => openGroupModal(group)}
                    onAssignTeacher={() => setAssignGroupId(group.id)}
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(group);
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Удалить группу "${group.name}"?`)) {
                          handleDeleteSingleGroup(group.id);
                        }
                      }}
                      disabled={deletingSingleGroup === group.id}
                    >
                      {deletingSingleGroup === group.id ? (
                        <div className="w-3 h-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Trash className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

              <Dialog open={assignGroupId !== null} onOpenChange={(isOpen) => {
          if (!isOpen) {
            setAssignGroupId(null);
            setSelectedTeacher(null);
            setTeacherSearch('');
          }
        }}>
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

        <Dialog open={assignStudentId !== null} onOpenChange={(isOpen) => {
          if (!isOpen) {
            setAssignStudentId(null);
            setSelectedStudent(null);
            setStudentSearch('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить студента</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Выберите студента, чтобы добавить его в группу "{groups.find(g => g.id === assignStudentId)?.name}".</p>
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Поиск по ФИО студента..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
              </div>
              <div className="max-h-60 overflow-y-auto border rounded-md">
                {allStudents
                  .filter(s => s.full_name.toLowerCase().includes(studentSearch.toLowerCase()))
                  .map(s => (
                  <div
                    key={s.id}
                    className={`p-2 cursor-pointer hover:bg-muted ${selectedStudent === s.id ? 'bg-primary text-primary-foreground' : ''}`}
                    onClick={() => setSelectedStudent(s.id)}
                  >
                    {s.full_name}
                  </div>
                ))}
              </div>
              {assignError && <div className="text-red-500 text-sm">{assignError}</div>}
            </div>
            <DialogFooter>
              <Button onClick={handleAssignStudent} disabled={assigning || !selectedStudent}>
                {assigning ? 'Добавление...' : 'Добавить'}
              </Button>
              <Button variant="outline" onClick={() => setAssignStudentId(null)}>Отмена</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      <GroupModal
        group={groupModal}
        isOpen={!!groupModal}
        onClose={() => setGroupModal(null)}
        onDelete={handleDeleteSingleGroup}
        onAssignTeacher={(groupId) => setAssignGroupId(groupId)}
        onAssignStudent={(groupId) => setAssignStudentId(groupId)}
        onRemoveTeacher={handleRemoveTeacher}
        onRemoveStudent={handleRemoveStudent}
        students={students}
        teachers={groupTeachers}
        deletingGroup={deletingSingleGroup}
        removingTeacher={removingTeacher}
        removingStudent={removingStudent}
      />
      
      <Dialog open={deleteModalOpen} onOpenChange={(isOpen) => {
        setDeleteModalOpen(isOpen);
        if (!isOpen) {
          // Очищаем выбранные группы при закрытии модального окна
          setSelectedGroupsToDelete([]);
          setDeleteError(null);
        }
      }}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Удаление групп</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Выберите группы, которые хотите удалить. Это действие нельзя отменить.
            </p>
            <p className="text-sm text-red-600 font-medium">
              ⚠️ Внимание: Удаление группы приведет к удалению всех связанных данных (студенты, преподаватели, тесты).
            </p>
          </div>
          
          <ul className="max-h-60 overflow-y-auto border rounded p-2 bg-muted/30 divide-y">
            {groups.filter(g => g.id !== -1).map(g => (
              <li key={g.id} className="flex items-center gap-2 py-2">
                <Checkbox
                  checked={selectedGroupsToDelete.includes(g.id)}
                  onCheckedChange={v => {
                    setSelectedGroupsToDelete(prev => v ? [...prev, g.id] : prev.filter(id => id !== g.id));
                  }}
                  id={`delete-group-${g.id}`}
                />
                <label htmlFor={`delete-group-${g.id}`} className="cursor-pointer">
                  <div className="font-medium">{g.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {g.start_year}–{g.end_year}
                    {g.description && ` • ${g.description}`}
                  </div>
                </label>
              </li>
            ))}
          </ul>
          
          {deleteError && (
            <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded">
              {deleteError}
            </div>
          )}
          
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="destructive"
              disabled={selectedGroupsToDelete.length === 0 || deleting}
              onClick={handleDeleteGroups}
            >
              {deleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Удаление...
                </>
              ) : (
                `Удалить ${selectedGroupsToDelete.length > 0 ? `(${selectedGroupsToDelete.length})` : ''}`
              )}
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Отмена</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модальное окно редактирования группы */}
      <Dialog open={editModalOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setEditModalOpen(false);
          setEditingGroup(null);
          setEditForm({ name: '', start_year: '', end_year: '', description: '' });
          setEditError(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать группу</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Измените данные группы. После сохранения изменения будут применены.
            </p>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Название группы</label>
              <Input
                placeholder="Введите название группы"
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Год начала</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={editForm.start_year}
                  onChange={e => setEditForm(f => ({ ...f, start_year: e.target.value }))}
                  required
                >
                  <option value="">Выберите год</option>
                  {Array.from({ length: 81 }, (_, i) => 2020 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Год окончания</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={editForm.end_year}
                  onChange={e => setEditForm(f => ({ ...f, end_year: e.target.value }))}
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
              <label className="text-sm font-medium">Описание группы</label>
              <Textarea
                placeholder="Описание группы (необязательно)"
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>
            
            {editError && <div className="text-red-500 text-sm">{editError}</div>}
            
            <DialogFooter>
              <Button type="submit" disabled={editing}>
                {editing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Сохранение...
                  </>
                ) : (
                  "Сохранить"
                )}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">Отмена</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGroupsTab; 