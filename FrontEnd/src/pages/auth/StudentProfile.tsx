import React from 'react';
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
import { Loader2, Users, BookOpen, FileText, Settings, Award, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StudentProgress } from "@/services/progressApi";

interface StudentProfileProps {
  user: any;
  progress: StudentProgress | null;
  isLoading: boolean;
  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  editLoading: boolean;
  editError: string | null;
  editForm: { full_name: string; username: string };
  setEditForm: (form: { full_name: string; username: string }) => void;
  handleEditSave: () => void;
}

export default function StudentProfile({
  user,
  progress,
  isLoading,
  editOpen,
  setEditOpen,
  editLoading,
  editError,
  editForm,
  setEditForm,
  handleEditSave
}: StudentProfileProps) {
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
                <Badge variant="default" className="text-sm bg-green-600">Студент</Badge>
                <Badge variant="outline" className="text-sm">ID: {user.id}</Badge>
              </div>
            </div>
            <Button variant="outline" className="ml-auto" onClick={() => setEditOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          </div>
        </div>

        {/* Статистика обучения */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Пройдено тестов</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '-' : progress ? progress.completedTests : 0}
              </div>
              <p className="text-xs text-muted-foreground">Всего завершено</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Средний балл</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '-' : progress ? `${progress.averageScore}%` : '0%'}
              </div>
              <p className="text-xs text-muted-foreground">Успеваемость</p>
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