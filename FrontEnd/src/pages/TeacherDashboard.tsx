// TestWise/src/pages/TeacherDashboard.tsx

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { groupApi, Group } from '@/services/groupApi';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Users, 
  BookOpen, 
  BarChart2, 
  MessageSquare, 
  FileText 
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { progressApi } from '@/services/progressApi';
import { userApi, User } from '@/services/userApi';
import { topicApi, Topic } from '@/services/topicApi';
import GroupCard from '@/components/admin/GroupCard';

export default function TeacherDashboard({ withoutLayout = false }: { withoutLayout?: boolean }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', start_year: '', end_year: '', description: '', student_count: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const { user } = useAuth();
  const [analyticsTab, setAnalyticsTab] = useState<'groups' | 'analytics' | 'content'>('groups');
  const [teacherGroups, setTeacherGroups] = useState<Group[]>([]);
  const [groupStudents, setGroupStudents] = useState<{[groupId: number]: User[]}>({});
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [studentProgress, setStudentProgress] = useState<any>(null);
  const [groupProgress, setGroupProgress] = useState<{avgScore: number, completedTests: number} | null>(null);
  const [myTopics, setMyTopics] = useState<Topic[]>([]);
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const demoGroup = {
      id: -1,
      name: 'Демонстрационная группа',
      start_year: 2023,
      end_year: 2024,
      description: 'Группа для примера. Назначьте сюда преподавателя через панель администратора.',
      is_archived: false,
    };
    const addDemoGroup = (arr: Group[]) => {
      if (!arr.some(g => g.id === -1)) {
        return [demoGroup, ...arr];
      }
      return arr;
    };
    if (user.role === 'teacher') {
      groupApi.getMyGroups()
        .then(async (groups) => {
          setGroups(groups);
          setTeacherGroups(groups);
          // Загружаем студентов для каждой группы
          const studentsByGroup: {[groupId: number]: User[]} = {};
          for (const group of groups) {
            const groupStudents = await groupApi.getGroupStudents(group.id);
            // Получаем пользователей по user_id
            const allUsers = await userApi.getAllUsers();
            const usersInGroup = groupStudents.map(gs => allUsers.find(u => u.id === gs.user_id)).filter(Boolean) as User[];
            studentsByGroup[group.id] = usersInGroup;
          }
          setGroupStudents(studentsByGroup);
          // --- Дашборд тем преподавателя ---
          // TODO: backend должен добавить поле creator_id у темы
          const allTopics = await topicApi.getTopics();
          // const myTopics = allTopics.filter(t => t.creator_id === user.id); // <-- backend должен добавить поле creator_id
          // setMyTopics(myTopics);
          setMyTopics([]); // временно пусто, пока нет creator_id
        })
        .finally(() => setLoading(false));
    } else {
    groupApi.getGroups()
        .then(res => setGroups(addDemoGroup(res)))
      .finally(() => setLoading(false));
    }
  }, [user]);

  // Аналитика: прогресс по студенту
  useEffect(() => {
    if (selectedStudent) {
      progressApi.getStudentProgress(selectedStudent).then(setStudentProgress);
    } else {
      setStudentProgress(null);
    }
  }, [selectedStudent]);

  // Аналитика: прогресс по группе
  useEffect(() => {
    async function fetchGroupProgress() {
      if (!selectedGroup) {
        setGroupProgress(null);
        return;
      }
      const groupStudentsArr = groupStudents[selectedGroup] || [];
      if (!groupStudentsArr.length) {
        setGroupProgress({ avgScore: 0, completedTests: 0 });
        return;
      }
      const progresses = await Promise.all(
        groupStudentsArr.map(async (u) => {
          try {
            return await progressApi.getStudentProgress(u.id);
          } catch {
            return null;
          }
        })
      );
      const valid = progresses.filter(Boolean);
      const completedTests = valid.reduce((sum, p) => sum + p.completedTests, 0);
      const avgScore = valid.length > 0 ? Math.round(valid.reduce((sum, p) => sum + p.averageScore, 0) / valid.length) : 0;
      setGroupProgress({ avgScore, completedTests });
    }
    fetchGroupProgress();
  }, [selectedGroup, groupStudents]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      // Проверка на неотрицательные числа
      if (
        Number(form.start_year) < 0 ||
        Number(form.end_year) < 0 ||
        (form.student_count && Number(form.student_count) < 0)
      ) {
        setError('Числовые значения не могут быть отрицательными');
        setCreating(false);
        return;
      }
      if (file) {
        // Если выбран файл, отправляем FormData
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('start_year', form.start_year);
        formData.append('end_year', form.end_year);
        formData.append('description', form.description);
        formData.append('file', file);
        // TODO: заменить на реальный endpoint для загрузки файла
        await fetch('/api/groups/upload', {
          method: 'POST',
          body: formData,
        });
        // После успешной загрузки файла
        setFile(null);
        setForm({ name: '', start_year: '', end_year: '', description: '', student_count: '' });
        setOpen(false);
        // Можно добавить обновление списка групп, если API поддерживает
      } else {
        // Обычное создание группы
      const newGroup = await groupApi.createGroup({
        ...form,
        start_year: Number(form.start_year),
        end_year: Number(form.end_year),
      });
      setGroups((prev) => [...prev, newGroup]);
      setForm({ name: '', start_year: '', end_year: '', description: '', student_count: '' });
      setOpen(false);
      }
    } catch (err) {
      setError('Ошибка при создании группы');
    } finally {
      setCreating(false);
    }
  };

  const content = (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Панель управления</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Создать группу</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать новую группу</DialogTitle>
              <DialogDescription>Введите данные для новой группы.</DialogDescription>
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
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || Number(val) >= 0) setForm(f => ({ ...f, start_year: val }));
                }}
                required
              />
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Год окончания"
                type="number"
                min="0"
                value={form.end_year}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || Number(val) >= 0) setForm(f => ({ ...f, end_year: val }));
                }}
                required
              />
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Количество студентов (для генерации логинов)"
                type="number"
                min="0"
                value={form.student_count}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || Number(val) >= 0) setForm(f => ({ ...f, student_count: val }));
                }}
                disabled={!!file}
              />
              <div>
                <label className="block text-sm font-medium mb-1">Загрузить файл для создания группы</label>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                />
                {file && (
                  <div className="text-xs text-muted-foreground mt-1">Файл: {file.name}</div>
                )}
              </div>
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

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Мои группы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherGroups.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Студенты в группах</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.values(groupStudents).reduce((sum, arr) => sum + arr.length, 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Мои темы</CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: backend должен добавить поле creator_id у темы */}
            <div className="text-2xl font-bold">{myTopics.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Основной контент */}
      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="groups">Группы</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          <TabsTrigger value="topics">Темы</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Группы студентов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-10">Загрузка...</div>
                ) : (
                  groups.map((group) => (
                    <GroupCard
                      key={group.id}
                      name={group.name}
                      start_year={group.start_year}
                      end_year={group.end_year}
                      description={group.description}
                      isDemo={group.id === -1}
                      onClick={group.id === -1 ? () => setDemoOpen(true) : undefined}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Аналитика</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Мои группы</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{teacherGroups.length}</div>
                </CardContent>
              </Card>
          <Card>
            <CardHeader>
                  <CardTitle>Студенты в группах</CardTitle>
            </CardHeader>
            <CardContent>
                  <div className="text-3xl font-bold">{Object.values(groupStudents).reduce((sum, arr) => sum + arr.length, 0)}</div>
                </CardContent>
              </Card>
                        </div>
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-2">Прогресс по студенту</h3>
              <Select
                onValueChange={val => setSelectedStudent(Number(val))}
                value={selectedStudent?.toString() || ''}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Выберите студента" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(groupStudents).flat().map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.full_name || user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {studentProgress && (
                <div className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Выполненные тесты: {studentProgress.completedTests}</CardTitle>
                      <div>Средний балл: {studentProgress.averageScore}%</div>
                      <div>Последняя активность: {new Date(studentProgress.lastActivity).toLocaleDateString()}</div>
                    </CardHeader>
                    <CardContent>
                      <div className="font-semibold mb-2">История тестов:</div>
                      {studentProgress.testHistory.length > 0 ? (
                        <ul className="list-disc pl-6">
                          {studentProgress.testHistory.map((test, idx) => (
                            <li key={idx}>
                              Тест #{test.testId}: {test.score}% ({new Date(test.date).toLocaleDateString()})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-muted-foreground">Нет данных о тестах</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
              </div>
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-2">Прогресс по группе</h3>
              <Select
                onValueChange={val => setSelectedGroup(Number(val))}
                value={selectedGroup?.toString() || ''}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Выберите группу" />
                </SelectTrigger>
                <SelectContent>
                  {teacherGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {groupProgress && (
                <div className="mt-4">
          <Card>
            <CardHeader>
                      <CardTitle>Выполненные тесты: {groupProgress.completedTests}</CardTitle>
                      <div>Средний балл: {groupProgress.avgScore}%</div>
            </CardHeader>
                  </Card>
                </div>
              )}
                </div>
              </div>
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Мои темы</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-10">Загрузка...</div>
              ) : myTopics.length === 0 ? (
                <div className="text-muted-foreground">У вас пока нет созданных тем.</div>
              ) : (
              <div className="space-y-4">
                  {myTopics.map((topic) => (
                    <div key={topic.id} className="border rounded p-3 bg-slate-50">
                      <div className="font-semibold text-lg">{topic.title}</div>
                      {topic.description && <div className="text-sm text-muted-foreground mt-1">{topic.description}</div>}
                  </div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Модалка для демонстрационной группы */}
      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Демонстрационная группа — Студенты</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div><b>Название:</b> Демонстрационная группа</div>
            <div><b>Годы:</b> 2023–2024</div>
            <div><b>Описание:</b> Группа для примера. Назначьте сюда преподавателя через панель администратора.</div>
            <div><b>Студенты:</b></div>
            <table className="w-full border mt-2">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-left">ФИО</th>
                  <th className="p-2 text-left">Логин</th>
                  <th className="p-2 text-left">Пароль</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2">Иван Иванов</td>
                  <td className="p-2">student0001</td>
                  <td className="p-2">demo1234</td>
                </tr>
                <tr>
                  <td className="p-2">Мария Петрова</td>
                  <td className="p-2">student0002</td>
                  <td className="p-2">demo5678</td>
                </tr>
                <tr>
                  <td className="p-2">Демо-студент 3</td>
                  <td className="p-2">student0003</td>
                  <td className="p-2">demo9999</td>
                </tr>
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
    </div>
  );
  return withoutLayout ? content : <Layout>{content}</Layout>;
} 