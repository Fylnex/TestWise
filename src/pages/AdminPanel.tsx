import React from 'react';
import { UserManagement } from '../components/admin/UserManagement';
import { StudentProgress } from '../components/admin/StudentProgress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from '@/components/Header';
import Layout from '@/components/Layout';

export function AdminPanel() {
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
        
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="progress">Student Progress</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="progress">
            <StudentProgress />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
} 