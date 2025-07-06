// TestWise/src/pages/AdminPanel.tsx
import React, { useEffect, useState } from 'react';
import { UserManagement } from '../../../components/admin/UserManagement';
import { StudentProgress } from '../../../components/admin/StudentProgress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from '@/components/Header';
import Layout from '@/components/Layout';
import TeacherDashboard from '../teacher/TeacherDashboard';
import AdminGroupsTab from './AdminGroupsTab';
import AdminAnalyticsTab from './AdminAnalyticsTab';
import AdminRolesTab from './AdminRolesTab';
import NotFound from '../../main/NotFound';

export function AdminPanel() {
  const [tab, setTab] = useState(() => localStorage.getItem('adminTab') || 'users');
  useEffect(() => { localStorage.setItem('adminTab', tab); }, [tab]);
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Панель администратора</h1>
        
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Управление пользователями</TabsTrigger>
            <TabsTrigger value="analytics">Аналитика</TabsTrigger>
            <TabsTrigger value="groups">Группы</TabsTrigger>
            <TabsTrigger value="roles">Роли</TabsTrigger>
            <TabsTrigger value="teacher">Панель преподавателя</TabsTrigger>
            {/* <TabsTrigger value="notfound" className="text-red-500">Страница 404</TabsTrigger> */}
          </TabsList>
          
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="analytics">
            <AdminAnalyticsTab />
          </TabsContent>
          
          <TabsContent value="groups">
            <AdminGroupsTab />
          </TabsContent>
          
          <TabsContent value="roles">
            <AdminRolesTab />
          </TabsContent>

          <TabsContent value="teacher">
            <TeacherDashboard withoutLayout={true} />
          </TabsContent>
          
          {/* <TabsContent value="notfound">
            <div className="border rounded-lg overflow-hidden">
              <NotFound />
            </div>
          </TabsContent> */}
        </Tabs>
      </div>
    </Layout>
  );
} 