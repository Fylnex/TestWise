import React, { useState, useEffect } from 'react';
import { userApi, User } from '../../services/api';
import type { StudentProgress } from '../../services/api';
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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userApi.getAllUsers();
      setUsers(data.filter(user => user.role === 'student'));
    } catch (error) {
      toast.error('Failed to load students');
    }
  };

  const loadProgress = async (studentId: number) => {
    try {
      const data = await userApi.getStudentProgress(studentId);
      setProgress(data);
    } catch (error) {
      toast.error('Failed to load student progress');
    }
  };

  const handleStudentSelect = (studentId: string) => {
    const id = parseInt(studentId);
    setSelectedStudent(id);
    loadProgress(id);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Прогресс студента</h2>
      
      <div className="mb-6">
        <Select onValueChange={handleStudentSelect}>
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
      </div>

      {progress && (
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
                {progress.testHistory.map((test, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                  >
                    <div>
                      <p className="font-medium">Test #{test.testId}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(test.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{test.score}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 