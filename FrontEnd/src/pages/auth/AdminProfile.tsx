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
import { Loader2, Users, BookOpen, FileText, Activity, Settings, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { dashboardApi, SystemStats } from '@/services/dashboardApi';

interface AdminProfileProps {
  user: any;
  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  editLoading: boolean;
  editError: string | null;
  editForm: { full_name: string; username: string };
  setEditForm: (form: { full_name: string; username: string }) => void;
  handleEditSave: () => void;
}

export default function AdminProfile({
  user,
  editOpen,
  setEditOpen,
  editLoading,
  editError,
  editForm,
  setEditForm,
  handleEditSave
}: AdminProfileProps) {
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalTopics: 0,
    totalTests: 0,
    activeSessions: 0,
    systemHealth: 'excellent',
    lastBackup: new Date().toISOString(),
    uptime: '99.9%',
    userGrowth: 0,
    topicGrowth: 0,
    testGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const statsData = await dashboardApi.getSystemStats();
        setSystemStats(statsData);
      } catch (error) {
        console.error('Ошибка загрузки данных дашборда:', error);
        setError('Ошибка загрузки данных. Попробуйте обновить страницу.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <LayoutWithoutFooter>
        <div className="max-w-[1000px] mx-auto py-6 px-4">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Загрузка данных...</span>
          </div>
        </div>
      </LayoutWithoutFooter>
    );
  }

  if (error) {
    return (
      <LayoutWithoutFooter>
        <div className="max-w-[1000px] mx-auto py-6 px-4">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-600 mb-2">Ошибка загрузки</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Обновить страницу
            </Button>
          </div>
        </div>
      </LayoutWithoutFooter>
    );
  }

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
                <Badge variant="destructive" className="text-sm">Администратор</Badge>
                <Badge variant="outline" className="text-sm">ID: {user.id}</Badge>
                <Badge variant={user.isActive ? "default" : "secondary"} className="text-sm">
                  {user.isActive ? 'Активен' : 'Заблокирован'}
                </Badge>
              </div>
            </div>
            <Button variant="outline" className="ml-auto" onClick={() => setEditOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          </div>
        </div>

        {/* Статистика системы */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {systemStats.userGrowth > 0 ? '+' : ''}{systemStats.userGrowth}% с прошлого месяца
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Темы</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalTopics}</div>
              <p className="text-xs text-muted-foreground">
                {systemStats.topicGrowth > 0 ? '+' : ''}{systemStats.topicGrowth}% с прошлого месяца
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Тесты</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalTests}</div>
              <p className="text-xs text-muted-foreground">
                {systemStats.testGrowth > 0 ? '+' : ''}{systemStats.testGrowth}% с прошлого месяца
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные сессии</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.activeSessions}</div>
              <p className="text-xs text-muted-foreground">Сейчас онлайн</p>
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
                <label className="text-sm font-medium text-muted-foreground">Роль</label>
                <Badge variant="destructive" className="text-sm">Администратор</Badge>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Статус</label>
                <Badge variant={user.isActive ? "default" : "secondary"} className="text-sm">
                  {user.isActive ? 'Активен' : 'Заблокирован'}
                </Badge>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Дата регистрации</label>
                <p className="text-sm">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Не указано'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Последний вход</label>
                <p className="text-sm">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Не указано'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

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