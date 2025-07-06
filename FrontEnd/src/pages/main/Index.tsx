import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { topicApi, Topic } from "@/services/topicApi";
import { progressApi, StudentProgress } from "@/services/progressApi";
import { userApi, User } from "@/services/userApi";
import { PlusCircle, ArrowRight } from "lucide-react";

const Index = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
    topicApi.getTopics()
      .then(setTopics)
      .finally(() => setLoading(false));
    userApi.getAllUsers()
      .then(setUsers)
      .catch(() => setUsers([]));
    if (user && user.role === 'student') {
      setProgressLoading(true);
      progressApi.getStudentProgress(user.id)
        .then(setProgress)
        .finally(() => setProgressLoading(false));
    }
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    const handleTopicsUpdated = () => {
      topicApi.getTopics().then(setTopics);
    };
    window.addEventListener('topics-updated', handleTopicsUpdated);
    return () => {
      window.removeEventListener('topics-updated', handleTopicsUpdated);
    };
  }, []);

  const getAuthorName = (creator_id?: number) => {
    if (!creator_id) return 'Неизвестно';
    const userObj = users.find(u => u.id === creator_id);
    return userObj?.full_name || userObj?.username || 'Неизвестно';
  };

  return (
    <Layout>
      {/* Hero Section + Welcome */}
      <section className={`relative bg-slate-50 flex flex-col justify-center items-center overflow-hidden border-b border-slate-200 ${
        user?.role === 'teacher' ? 'min-h-[30vh] py-8' : 'min-h-[60vh] py-16'
      }`}>
        <div className="absolute inset-0 pointer-events-none select-none opacity-10" aria-hidden>
          <svg width="100%" height="100%" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#6366f1" fillOpacity="0.2" d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,133.3C840,107,960,85,1080,101.3C1200,117,1320,171,1380,197.3L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
          </svg>
        </div>
        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 text-center">
          {user && (
            <>
              <h2 className={`font-extrabold text-slate-900 mb-4 ${
                user.role === 'teacher' ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'
              }`}>
                Добро пожаловать, {user.full_name || user.username}!
              </h2>
              <div className={`mb-4 text-slate-600 ${
                user.role === 'teacher' ? 'text-base' : 'text-lg'
              }`}>
                {user.role === 'student' && 'Рады видеть тебя на платформе! Начни обучение прямо сейчас.'}
                {user.role === 'teacher' && 'Ваша панель управления курсами и темами готова к работе.'}
                {user.role === 'admin' && 'Вы вошли как администратор. Управляйте платформой эффективно!'}
              </div>
            </>
          )}
          <Button 
            size={user?.role === 'teacher' ? 'default' : 'lg'} 
            className={`${
              user?.role === 'teacher' 
                ? 'px-6 py-2 rounded-lg' 
                : 'text-lg px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-transform'
            }`} 
            onClick={() => navigate('/topics')}
          >
            Начать обучение
          </Button>
        </div>
      </section>



      {/* Быстрые действия и персонализация для админа */}
      {/* {user?.role === 'admin' && (
        <section className="py-8 bg-gradient-to-br from-indigo-50 to-white animate-fade-in">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Панель администратора</h2>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/admin')} variant="default">Панель управления</Button>
              <Button onClick={() => navigate('/admin/analytics')} variant="secondary">Аналитика</Button>
            </div>
          </div>
        </section>
      )} */}

      {/* Последние изучаемые темы для студента */}
      {user?.role === 'student' && !loading && (
        <section className="py-10 bg-white animate-fade-in border-b border-slate-100">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-slate-900">Последние изучаемые темы</h2>
            {topics.filter(t => (t as any).progress && (t as any).progress.completion_percentage > 0)
              .sort((a, b) => {
                const aDate = new Date((a as any).progress?.last_accessed || 0).getTime();
                const bDate = new Date((b as any).progress?.last_accessed || 0).getTime();
                return bDate - aDate;
              })
              .slice(0, 3).length === 0 ? (
                <div className="text-slate-500">Пока нет изучаемых тем. Начните обучение!</div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {topics.filter(t => (t as any).progress && (t as any).progress.completion_percentage > 0)
                    .sort((a, b) => {
                      const aDate = new Date((a as any).progress?.last_accessed || 0).getTime();
                      const bDate = new Date((b as any).progress?.last_accessed || 0).getTime();
                      return bDate - aDate;
                    })
                    .slice(0, 3)
                    .map(topic => (
                      <Link key={topic.id} to={`/topic/${topic.id}`} className="w-72">
                        <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow h-full flex flex-col justify-between animate-fade-in">
                          <div>
                            <h4 className="font-semibold text-lg mb-1 text-indigo-700">{topic.title}</h4>
                            <p className="text-sm text-slate-600 mb-2 line-clamp-2">{topic.description}</p>
                          </div>
                          <div className="mt-2">
                            <Progress value={(topic as any).progress?.completion_percentage ?? 0} className="h-2" />
                            <div className="text-xs text-slate-400 mt-1">Прогресс: {(topic as any).progress?.completion_percentage ?? 0}%</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              )}
          </div>
        </section>
      )}

      {/* Темы */}
      <section className={`bg-gradient-to-br from-slate-50 via-white to-indigo-50 animate-fade-in ${
        user?.role === 'teacher' ? 'py-8' : 'py-16'
      }`}>
        <div className="container mx-auto px-4">
          <h2 className={`font-bold text-center text-slate-900 ${
            user?.role === 'teacher' ? 'text-2xl md:text-3xl mb-6' : 'text-3xl md:text-4xl mb-10'
          }`}>Все темы</h2>
          {loading ? (
            <div className="text-center py-10 animate-pulse">Загрузка...</div>
          ) : topics.length === 0 ? (
            <div className="text-center py-10 text-slate-500 animate-fade-in">
              Нет доступных тем. {user?.role === 'teacher' ? 'Создайте свою первую тему!' : 'Ожидайте, когда преподаватель добавит темы.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {topics.map((topic) => (
                <div key={topic.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow overflow-hidden flex flex-col animate-fade-in">
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
                        <Button variant="secondary" className="text-lg px-6 py-2 rounded-full">Начать изучение</Button>
                      </Link>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-xl text-slate-900 mb-1">{topic.title}</h3>
                            <div className="text-sm text-slate-500 mb-1">{(topic as any).category || 'Без категории'}</div>
                            <div className="text-xs text-slate-400 mb-1">Автор: {getAuthorName((topic as any).creator_id)}</div>
                          </div>
                          <span className="text-sm text-indigo-600 font-semibold">
                            {(topic as any).progress?.completion_percentage ?? 0}%
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-4 flex-1">
                          {topic.description}
                        </p>
                        <Progress value={(topic as any).progress?.completion_percentage ?? 0} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Index;