// TestWise/src/pages/AdminPanel.tsx
import React from 'react';
import { UserManagement } from '../components/admin/UserManagement';
import { StudentProgress } from '../components/admin/StudentProgress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from '@/components/Header';
import Layout from '@/components/Layout';
import TeacherDashboard from './TeacherDashboard';

export function AdminPanel() {
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Панель администратора</h1>
        
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Управление пользователями</TabsTrigger>
            <TabsTrigger value="progress">Прогресс студентов</TabsTrigger>
            <TabsTrigger value="profile">Профиль</TabsTrigger>
            <TabsTrigger value="overall">Общий прогресс</TabsTrigger>
            <TabsTrigger value="teacher">Панель учителя</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="progress">
            <StudentProgress />
          </TabsContent>
          
          <TabsContent value="profile">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Профиль</h2>
              <p>Это ваша страница профиля. Здесь вы можете просматривать и редактировать информацию о своем профиле.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="overall">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Общий прогресс</h2>
              <p>Просмотр общего прогресса всех студентов.</p>
            </div>
          </TabsContent>

          <TabsContent value="teacher">
            <TeacherDashboard withoutLayout={true} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
} 