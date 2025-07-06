import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Layout from "@/components/Layout";
import {progressApi, StudentProgress} from "@/services/progressApi";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Profile() {
  const { user, updateUserData } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editLoading, setEditLoading] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState({ full_name: user?.full_name || '', username: user?.username || '' });

  React.useEffect(() => {
    if (user) {
      progressApi
        .getStudentProgress(user.id)
        .then((data) => {
          setProgress(data);
          console.log("Progress loaded:", data);
        })
        .catch((error) => console.error("Failed to load progress:", error))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleEditSave = async () => {
    setEditLoading(true);
    setEditError(null);
    try {
      const updated = await import('@/services/userApi').then(m => m.userApi.updateUser(user.id, { full_name: editForm.full_name, username: editForm.username }));
      updateUserData(updated);
      setEditOpen(false);
    } catch {
      setEditError('Ошибка при сохранении');
    } finally {
      setEditLoading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <p>Не аутентифицирован</p>
        </div>
      </Layout>
    );
  }

  // MOCK: функция для получения логов (заменить на реальный API)
  async function fetchLogs() {
    // Здесь должен быть реальный запрос к backend
    return [
      { id: 1, user: 'teacher1', action: 'Создал тему', target: 'Математика', date: '2024-06-01 12:00' },
      { id: 2, user: 'student2', action: 'Удалил вопрос', target: 'Тест по физике', date: '2024-06-01 13:15' },
      { id: 3, user: 'admin', action: 'Архивировал группу', target: '9А', date: '2024-06-01 14:00' },
    ];
  }

  // ADMIN: только основные данные и статус
  if (user.role === 'admin') {
    const [logs, setLogs] = React.useState<any[]>([]);
    const [logsLoading, setLogsLoading] = React.useState(true);
    React.useEffect(() => {
      setLogsLoading(true);
      fetchLogs().then(setLogs).finally(() => setLogsLoading(false));
    }, []);
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <h1 className="text-3xl font-bold mb-6">Профиль администратора</h1>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl">
                      {user.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">{user.username}</h2>
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">Администратор</div>
                    <div className="mt-2 text-muted-foreground">{user.full_name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">ID: {user.id}</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">Статус: {user.isActive ? 'Активен' : 'Заблокирован'}</div>
                <Button variant="outline" className="mt-4" onClick={() => setEditOpen(true)}>Редактировать</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Логи системы</CardTitle>
                <CardDescription>Последние действия пользователей</CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : logs.length === 0 ? (
                  <div className="text-muted-foreground">Нет событий</div>
                ) : (
                  <ul className="divide-y">
                    {logs.map(log => (
                      <li key={log.id} className="py-2 text-sm">
                        <span className="font-semibold text-blue-800">{log.user}</span> — {log.action} <span className="font-semibold">{log.target}</span> <span className="text-xs text-muted-foreground">({log.date})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="max-w-md w-full">
              <DialogHeader>
                <DialogTitle>Редактировать профиль</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  value={editForm.full_name}
                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="ФИО"
                />
                <Input
                  value={editForm.username}
                  onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="Логин"
                />
                {editError && <div className="text-red-500 text-sm">{editError}</div>}
              </div>
              <DialogFooter>
                <Button onClick={handleEditSave} disabled={editLoading}>{editLoading ? 'Сохранение...' : 'Сохранить'}</Button>
                <DialogClose asChild>
                  <Button variant="outline" type="button">Отмена</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    );
  }

  // TEACHER: основные данные, группы, темы, статистика по тестам
  if (user.role === 'teacher') {
    const [groups, setGroups] = React.useState<any[]>([]);
    const [topics, setTopics] = React.useState<any[]>([]);
    const [stats, setStats] = React.useState<{ completed: number; avg: number } | null>(null);
    React.useEffect(() => {
      (async () => {
        const myGroups = await import('@/services/groupApi').then(m => m.groupApi.getMyGroups());
        setGroups(myGroups);
        const allTopics = await import('@/services/topicApi').then(m => m.topicApi.getTopics());
        setTopics(allTopics.filter((t: any) => t.creator_id === user.id));
        // Статистика по тестам (по всем студентам в группах)
        // Можно доработать: сейчас просто среднее по себе
        const prog = await progressApi.getStudentProgress(user.id);
        setStats({ completed: prog.completedTests, avg: prog.averageScore });
      })();
    }, [user.id]);
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <h1 className="text-3xl font-bold mb-6">Профиль учителя</h1>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl">
                      {user.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">{user.username}</h2>
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">Учитель</div>
                    <div className="mt-2 text-muted-foreground">{user.full_name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">ID: {user.id}</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">Статус: {user.isActive ? 'Активен' : 'Заблокирован'}</div>
                <Button variant="outline" className="mt-4" onClick={() => setEditOpen(true)}>Редактировать</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Статистика</CardTitle>
                <CardDescription>Ваши тесты и группы</CardDescription>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span>Пройдено тестов:</span>
                      <span className="font-bold">{stats.completed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Средний балл:</span>
                      <span className="font-bold">{stats.avg}%</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                )}
                <div className="mt-4">
                  <div className="font-semibold mb-1">Мои группы:</div>
                  {groups.length === 0 ? (
                    <div className="text-muted-foreground text-sm">Нет групп</div>
                  ) : (
                    <ul className="list-disc pl-5 text-sm">
                      {groups.map((g) => (
                        <li key={g.id}>{g.name} ({g.start_year}–{g.end_year})</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mt-4">
                  <div className="font-semibold mb-1">Мои темы:</div>
                  {topics.length === 0 ? (
                    <div className="text-muted-foreground text-sm">Нет тем</div>
                  ) : (
                    <ul className="list-disc pl-5 text-sm">
                      {topics.map((t) => (
                        <li key={t.id}>{t.title}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="max-w-md w-full">
              <DialogHeader>
                <DialogTitle>Редактировать профиль</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  value={editForm.full_name}
                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="ФИО"
                />
                <Input
                  value={editForm.username}
                  onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="Логин"
                />
                {editError && <div className="text-red-500 text-sm">{editError}</div>}
              </div>
              <DialogFooter>
                <Button onClick={handleEditSave} disabled={editLoading}>{editLoading ? 'Сохранение...' : 'Сохранить'}</Button>
                <DialogClose asChild>
                  <Button variant="outline" type="button">Отмена</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    );
  }

  // STUDENT: как было (основные данные + прогресс)
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Профиль студента</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl">
                    {user.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{user.username}</h2>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">Студент</div>
                  <div className="mt-2 text-muted-foreground">{user.full_name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">ID: {user.id}</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Статус: {user.isActive ? 'Активен' : 'Заблокирован'}</div>
              <Button variant="outline" className="mt-4" onClick={() => setEditOpen(true)}>Редактировать</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
              <CardDescription>Ваш прогресс обучения</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : progress ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Пройдено тестов:</span>
                    <span className="font-bold">{progress.completedTests}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Средний балл:</span>
                    <span className="font-bold">{progress.averageScore}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Последняя активность:</span>
                    <span className="font-bold">
                      {new Date(progress.lastActivity).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ) : (
                <p>Нет данных о прогрессе</p>
              )}
            </CardContent>
          </Card>
        </div>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle>Редактировать профиль</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                value={editForm.full_name}
                onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="ФИО"
              />
              <Input
                value={editForm.username}
                onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Логин"
              />
              {editError && <div className="text-red-500 text-sm">{editError}</div>}
            </div>
            <DialogFooter>
              <Button onClick={handleEditSave} disabled={editLoading}>{editLoading ? 'Сохранение...' : 'Сохранить'}</Button>
              <DialogClose asChild>
                <Button variant="outline" type="button">Отмена</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
