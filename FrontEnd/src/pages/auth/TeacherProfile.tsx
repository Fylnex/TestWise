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
import { Loader2, Users, BookOpen, Settings, Users2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';


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
  const [groupsModalOpen, setGroupsModalOpen] = useState(false);
  const [topicsModalOpen, setTopicsModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [myGroups, myTopics] = await Promise.all([
          import('@/services/groupApi').then(m => m.groupApi.getMyGroups()),
          import('@/services/topicApi').then(m => m.topicApi.getMyTopics())
        ]);
        setGroups(myGroups);
        setTopics(myTopics);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      }
    })();
  }, [user.id]);

  return (
    <LayoutWithoutFooter>
      <div className="max-w-[1000px] mx-auto py-6 px-4">
        {/* Заголовок и основная информация */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-2xl">
                {user.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{user.full_name || user.username}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="default" className="text-sm bg-blue-600">Учитель</Badge>
                <Badge variant="outline" className="text-sm">ID: {user.id}</Badge>
              </div>
            </div>
            <Button variant="outline" className="ml-auto" onClick={() => setEditOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          </div>
        </div>

        {/* Статистика преподавания */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setGroupsModalOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Мои группы</CardTitle>
              <Users2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groups.length}</div>
              <p className="text-xs text-muted-foreground">Активных групп</p>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setTopicsModalOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Созданные темы</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topics.length}</div>
              <p className="text-xs text-muted-foreground">Учебных материалов</p>
            </CardContent>
          </Card>
        </div>

        {/* Информация о пользователе */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Информация о пользователе
            </CardTitle>
            <CardDescription>
              Основная информация о вашем аккаунте
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Имя пользователя</label>
                <p className="text-sm font-medium">{user.username}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Полное имя</label>
                <p className="text-sm font-medium">{user.full_name || 'Не указано'}</p>
              </div>
                             <div className="space-y-2">
                 <label className="text-sm font-medium text-muted-foreground">Дата регистрации</label>
                 <p className="text-sm">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Не указано'}</p>
               </div>
                               <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Последний вход</label>
                  <p className="text-sm">{new Date().toLocaleDateString()}</p>
                </div>
            </div>
          </CardContent>
        </Card>



        {/* Модальное окно для групп */}
        <Dialog open={groupsModalOpen} onOpenChange={setGroupsModalOpen}>
          <DialogContent className="max-w-2xl w-full">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users2 className="h-5 w-5" />
                Мои группы
              </DialogTitle>
              <DialogDescription>
                Группы, которыми вы руководите
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {groups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>У вас пока нет групп</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{g.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Учебный год: {g.start_year}–{g.end_year}
                        </p>
                        {g.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {g.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={g.is_archived ? "secondary" : "default"} className="text-xs">
                          {g.is_archived ? 'Архив' : 'Активна'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          ID: {g.id}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </DialogContent>
        </Dialog>

        {/* Модальное окно для тем */}
        <Dialog open={topicsModalOpen} onOpenChange={setTopicsModalOpen}>
          <DialogContent className="max-w-2xl w-full">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Мои темы
              </DialogTitle>
              <DialogDescription>
                Созданные вами учебные материалы
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {topics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>У вас пока нет созданных тем</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topics.map((t) => (
                    <div key={t.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{t.title}</h3>
                        {t.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {t.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Создана: {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Не указано'}</span>
                          {t.updated_at && (
                            <span>Обновлена: {new Date(t.updated_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={t.is_archived ? "secondary" : "default"} className="text-xs">
                          {t.is_archived ? 'Архив' : 'Активна'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          ID: {t.id}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </DialogContent>
        </Dialog>

        {/* Диалог редактирования */}
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
              <Button onClick={handleEditSave} disabled={editLoading}>
                {editLoading ? 'Сохранение...' : 'Сохранить'}
              </Button>
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