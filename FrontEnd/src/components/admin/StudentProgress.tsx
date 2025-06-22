// TestWise/FrontEnd/src/components/student/StudentProgress.tsx
// -*- coding: utf-8 -*-
// """Компонент отображения прогресса студента.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Отображает статистику и историю тестов для выбранного студента.
// """

import React, { useState, useEffect } from "react";
import { userApi, User } from "@/services/userApi.ts";
import  { progressApi} from "@/services/progressApi.ts";
import type { StudentProgress } from "@/services/progressApi.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function StudentProgress() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await userApi.getAllUsers();
      const students = data.filter((user) => user.role === "student");
      setUsers(students);
      if (students.length > 0 && !selectedStudent) {
        setSelectedStudent(students[0].id);
        await loadProgress(students[0].id);
      }
    } catch (error) {
      toast.error("Не удалось загрузить список студентов");
    } finally {
      setIsLoading(false);
    }
  };

  const loadProgress = async (studentId: number) => {
    try {
      setIsLoading(true);
      const data = await progressApi.getStudentProgress(studentId);
      setProgress(data);
    } catch (error) {
      toast.error("Не удалось загрузить прогресс студента");
      setProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    const id = parseInt(studentId, 10);
    setSelectedStudent(id);
    loadProgress(id);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Прогресс студента</h2>

      <div className="mb-6">
        <Select
          onValueChange={handleStudentSelect}
          value={selectedStudent?.toString() || ""}
          disabled={isLoading || users.length === 0}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Выберите студента" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {users.length === 0 && (
          <div className="text-muted-foreground text-sm mt-2">Нет доступных студентов</div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-4">Загрузка...</div>
      ) : progress ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Выполненные тесты</CardTitle>
              <CardDescription>Общее количество выполненных тестов</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{progress.completedTests}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Средний балл</CardTitle>
              <CardDescription>Общая успеваемость</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{progress.averageScore}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Последняя активность</CardTitle>
              <CardDescription>Последнее выполнение теста</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {new Date(progress.lastActivity).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-4">
            <CardHeader>
              <CardTitle>История тестов</CardTitle>
              <CardDescription>Последние результаты тестов</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progress.testHistory.length > 0 ? (
                  progress.testHistory.map((test, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                    >
                      <div>
                        <p className="font-medium">Тест #{test.testId}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(test.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{test.score}%</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">
                    Нет данных о пройденных тестах
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : selectedStudent ? (
        <div className="text-center py-4 text-muted-foreground">
          Нет данных о прогрессе для выбранного студента
        </div>
      ) : null}
    </div>
  );
}