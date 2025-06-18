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

export default function Profile() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <p>Не аутентифицирован</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Профиль пользователя</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>Ваши личные данные</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={`https://avatar.vercel.sh/${user.username}`}
                  />
                  <AvatarFallback className="text-2xl">
                    {user.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{user.username}</h2>
                  <p
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                      user.role === "admin"
                        ? "bg-red-100 text-red-800"
                        : user.role === "teacher"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.role === "admin"
                      ? "Администратор"
                      : user.role === "teacher"
                        ? "Учитель"
                        : "Студент"}
                  </p>
                </div>
              </div>
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
      </div>
    </Layout>
  );
}
