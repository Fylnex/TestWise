import React, { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LayoutWithoutFooter from "@/components/LayoutWithoutFooter";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { progressApi } from "@/services/progressApi";

interface TeacherProfileProps {
  user: any;
  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  editLoading: boolean;
  editError: string | null;
  editForm: { full_name: string; username: string };
  setEditForm: (form: { full_name: string; username: string }) => void;
  handleEditSave: () => void;
}

export default function TeacherProfile({
  user,
  editOpen,
  setEditOpen,
  editLoading,
  editError,
  editForm,
  setEditForm,
  handleEditSave
}: TeacherProfileProps) {
  const [groups, setGroups] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [stats, setStats] = useState<{ completed: number; avg: number } | null>(null);

  useEffect(() => {
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
    <LayoutWithoutFooter>
      <div className="max-w-[1000px] mx-auto py-6 px-4">
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
                onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="ФИО"
              />
              <Input
                value={editForm.username}
                onChange={e => setEditForm({ ...editForm, username: e.target.value })}
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
    </LayoutWithoutFooter>
  );
} 