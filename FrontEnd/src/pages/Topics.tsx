// TestWise/src/pages/Topics.tsx

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { topicApi, Topic } from "@/services/topicApi";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export default function Topics() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '', image: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    topicApi.getTopics()
      .then(setTopics)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const newTopic = await topicApi.createTopic(form);
      setTopics((prev) => [...prev, newTopic]);
      setForm({ title: '', description: '', category: '', image: '' });
      setOpen(false);
    } catch (err: any) {
      setError('Ошибка при создании темы');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Темы для изучения</h1>
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Добавить тему</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать новую тему</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="Название темы"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    required
                  />
                  <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="Категория"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  />
                  <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="Ссылка на изображение (необязательно)"
                    value={form.image}
                    onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                  />
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    placeholder="Описание темы"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                  {error && <div className="text-red-500 text-sm">{error}</div>}
                  <DialogFooter>
                    <Button type="submit" disabled={creating}>
                      {creating ? 'Создание...' : 'Создать'}
                    </Button>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Отмена</Button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {loading ? (
          <div className="text-center py-10">Загрузка...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <Card key={topic.id} className="overflow-hidden">
                <div className="aspect-video relative">
                  <img
                    src={topic.image || "https://images.unsplash.com/photo-1581092921461-39b9d08a9b21?auto=format&fit=crop&w=2070&q=80"}
                    alt={topic.title}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Link to={`/topic/${topic.id}`}>
                      <Button variant="secondary">Начать изучение</Button>
                    </Link>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{topic.title}</CardTitle>
                      <CardDescription>{topic.category}</CardDescription>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {topic.progress?.completion_percentage ?? 0}%
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {topic.description}
                  </p>
                  <Progress value={topic.progress?.completion_percentage ?? 0} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 