import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Header from '@/components/Header';
import { testApi } from '@/services/testApi';
import { questionApi } from '@/services/questionApi';
import { Test } from '@/types/test';
import { Question } from '@/types/test';
import { useAuth } from '@/context/AuthContext';
import TestViewer from '@/components/tests/TestViewer';

const TestPreview: React.FC = () => {
  const { testId, topicId, sectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!testId) return;

    const loadTest = async () => {
      try {
        setLoading(true);
        const [testData, questionsData] = await Promise.all([
          testApi.getTest(Number(testId)),
          questionApi.getQuestionsByTest(Number(testId))
        ]);

        setTest(testData);
        setQuestions(questionsData);
      } catch (err) {
        setError('Ошибка загрузки теста');
        console.error('Error loading test:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error || 'Тест не найден'}</div>
            <Button onClick={() => navigate(-1)}>Назад</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto py-8 max-w-6xl">
        {/* Заголовок */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => {
              if (topicId) {
                navigate(`/topic/${topicId}`);
              } else {
                navigate(-1);
              }
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {test.title}
              </h1>
            </div>
            {(user?.role === "admin" || user?.role === "teacher") && (
              <Button
                variant="outline"
                onClick={() => {
                  if (topicId && sectionId) {
                    navigate(`/topic/${topicId}/section/${sectionId}/test/${testId}/edit`);
                  } else if (topicId) {
                    navigate(`/topic/${topicId}/test/${testId}/edit`);
                  } else {
                    navigate(`/test/${testId}/edit`);
                  }
                }}
              >
                Редактировать
              </Button>
            )}
          </div>
        </div>

        <TestViewer test={test} questions={questions} />
      </div>
    </div>
  );
};

export default TestPreview;
