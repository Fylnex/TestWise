// TestWise/src/pages/AdminPanel.tsx
import React, { useEffect, useState } from 'react';
import { UserManagement } from '../../../components/admin/UserManagement';
import { StudentProgress } from '../../../components/admin/StudentProgress';
import { SystemLogs } from '../../../components/admin/SystemLogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from '@/components/Header';
import Layout from '@/components/Layout';
import GroupsTab from '../../../components/admin/GroupsTab';
import AdminAnalyticsTab from './AdminAnalyticsTab';
import AdminRolesTab from './AdminRolesTab';
import NotFound from '../../main/NotFound';

export function AdminPanel() {
  const [tab, setTab] = useState(() => localStorage.getItem('adminTab') || 'users');
  useEffect(() => { localStorage.setItem('adminTab', tab); }, [tab]);
  return (
    <Layout>
      <div className="max-w-[1000px] mx-auto px-6 py-6">
        <h1 className="text-3xl font-bold mb-6">Панель администратора</h1>
        
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
            <TabsTrigger value="groups">Группы</TabsTrigger>
            <TabsTrigger value="analytics">Аналитика</TabsTrigger>
            <TabsTrigger value="roles">Роли</TabsTrigger>
            <TabsTrigger value="logs">Логи</TabsTrigger>
            {/* <TabsTrigger value="notfound" className="text-red-500">Страница 404</TabsTrigger> */}
          </TabsList>
          
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="analytics">
            <AdminAnalyticsTab />
          </TabsContent>
          
          <TabsContent value="groups">
            <GroupsTab 
              title=""
              showCreateButton={true}
              showDeleteButton={true}
              showEditButton={true}
              showAssignButtons={true}
              className="px-0 py-0"
            />
          </TabsContent>
          
          <TabsContent value="roles">
            <AdminRolesTab />
          </TabsContent>

          <TabsContent value="logs">
            <SystemLogs />
          </TabsContent>
          
          {/* <TabsContent value="notfound">
            <div className="border rounded-lg overflow-hidden bg-white">
              <NotFound />
            </div>
          </TabsContent> */}
        </Tabs>
      </div>
    </Layout>
  );
} 