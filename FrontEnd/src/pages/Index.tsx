import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { topicApi, Topic } from "@/services/topicApi";

const Index = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      console.log("Authenticated user:", user);
    } else {
      console.log("User not authenticated, redirecting to login");
      navigate("/login");
    }

    topicApi.getTopics()
      .then(setTopics)
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate, user]);

  return (
    <Layout>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-800">
          Добро пожаловать на платформу ЛайнТест!
        </h1>
        {isAuthenticated && user && (
          <p className="text-slate-600 mt-2">
            Здравствуйте, {user.username} ({user.role})!
          </p>
        )}
        <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
          TestWise — современная образовательная платформа для изучения технических дисциплин. Здесь вы найдете интерактивные курсы, тесты, отслеживание прогресса и многое другое.<br/><br/>
          Выберите интересующую вас тему для начала обучения. После выбора темы вы сможете изучать материалы, проходить тесты и отслеживать свой прогресс.
        </p>
      </div>
      <div className="container mx-auto py-6">
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
};

export default Index;