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
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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