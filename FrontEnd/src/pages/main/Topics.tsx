import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { topicApi, Topic } from "@/services/topicApi";
import { PlusCircle } from 'lucide-react';

export default function Topics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = () => {
      topicApi.getTopics()
        .then(setTopics)
        .finally(() => setLoading(false));
    };

    fetchTopics(); // Initial fetch

    // Обновляем данные при каждом переходе на страницу
    const handleFocus = () => {
      fetchTopics();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('topics-updated', fetchTopics);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('topics-updated', fetchTopics);
    };
  }, []);

  const getAuthorName = (creator_full_name?: string) => {
    return creator_full_name || 'Неизвестно';
  };

  return (
    <Layout>
      <div className="max-w-[1000px] mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Темы для изучения</h1>
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <Button onClick={() => navigate('/topics/create')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Добавить тему
            </Button>
          )}
        </div>
        {loading ? (
          <div className="text-center py-10">Загрузка...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topics.map((topic) => (
              <Card key={topic.id} className="overflow-hidden shadow-lg rounded-2xl border-0 bg-white hover:shadow-2xl transition-shadow duration-300 animate-fade-in flex flex-col">
                <div className="aspect-video relative">
                  {topic.image ? (
                    <img
                      src={topic.image}
                      alt={topic.title}
                      className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 via-cyan-300 to-teal-200 flex items-center justify-center">
                      <span className="text-3xl text-white font-bold opacity-60 select-none">{topic.title.slice(0, 1)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Link to={`/topic/${topic.id}`}>
                      <Button variant="secondary">Начать изучение</Button>
                    </Link>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold mb-1">{topic.title}</CardTitle>
                      <CardDescription className="text-sm text-slate-500 mb-1">{topic.category || 'Без категории'}</CardDescription>
                      <div className="text-xs text-slate-400 mb-1">Автор: {getAuthorName(topic.creator_full_name)}</div>
                    </div>
                    <span className="text-sm text-indigo-600 font-semibold mt-1">
                      {(topic as any).progress?.completion_percentage ?? 0}%
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {topic.description}
                  </p>
                  <Progress value={(topic as any).progress?.completion_percentage ?? 0} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}