import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface Topic {
  id: string;
  title: string;
  description: string;
  progress: number;
  image: string;
  category: string;
}

const topics: Topic[] = [
  {
    id: "gtd",
    title: "Газотурбинные двигатели",
    description: "Изучение принципов работы, конструкции и эксплуатации газотурбинных двигателей",
    progress: 0,
    image: "https://images.unsplash.com/photo-1581092921461-39b9d08a9b21?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    category: "Двигатели"
  },
  {
    id: "diesel",
    title: "Дизельные двигатели",
    description: "Основы работы дизельных двигателей, их типы и особенности эксплуатации",
    progress: 0,
    image: "https://images.unsplash.com/photo-1581092921461-39b9d08a9b21?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    category: "Двигатели"
  },
  {
    id: "hydraulics",
    title: "Гидравлические системы",
    description: "Изучение гидравлических систем, их компонентов и принципов работы",
    progress: 0,
    image: "https://images.unsplash.com/photo-1581092921461-39b9d08a9b21?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    category: "Системы"
  },
  {
    id: "electrical",
    title: "Электрические системы",
    description: "Основы электротехники и электрических систем в технике",
    progress: 0,
    image: "https://images.unsplash.com/photo-1581092921461-39b9d08a9b21?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    category: "Системы"
  }
];

export default function Topics() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Темы для изучения</h1>
          {user?.role === 'admin' && (
            <Button variant="outline">
              Добавить тему
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <Card key={topic.id} className="overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={topic.image}
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
                    {topic.progress}%
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {topic.description}
                </p>
                <Progress value={topic.progress} className="h-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
} 