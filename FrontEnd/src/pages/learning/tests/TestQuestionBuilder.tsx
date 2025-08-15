import { useParams, useNavigate } from "react-router-dom";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { testApi, Test } from "@/services/testApi";
import { getTestTypeInRussian } from "@/lib/utils";

const TestQuestionBuilder = () => {
  const { testId, topicId, sectionId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (testId) {
      setLoading(true);
      // Используем getAllTests и находим нужный тест
      testApi.getAllTests()
        .then(tests => {
          const testData = tests.find(t => t.id === Number(testId));
          if (testData) {
            setTest(testData);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [testId]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-center">Загрузка...</div>
        </div>
      </Layout>
    );
  }

  if (!test) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-red-500 text-center">Тест не найден</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => {
            if (topicId) {
              navigate(`/topic/${topicId}`);
            } else {
              navigate(-1);
            }
          }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Редактирование вопросов теста</h1>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{test.title}</h2>
              <p className="text-gray-600 text-sm">Тип: {getTestTypeInRussian(test.type)}</p>
              {test.duration && (
                <p className="text-gray-600 text-sm">Длительность: {test.duration} минут</p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (topicId && sectionId) {
                  navigate(`/topic/${topicId}/section/${sectionId}/test/${test.id}/edit`);
                } else if (topicId) {
                  navigate(`/topic/${topicId}/test/${test.id}/edit`);
                } else {
                  navigate(`/test/${test.id}/edit`);
                }
              }}
            >
              Редактировать тест
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Конструктор вопросов</h3>
            <p className="text-muted-foreground text-sm">
              Здесь вы можете добавлять, редактировать и удалять вопросы теста. 
              Для каждого вопроса выберите тип, варианты ответа и правильный ответ. 
              Вопросы появятся в тесте в том порядке, в котором вы их добавите.
            </p>
          </div>
            
            {testId ? (
              <QuestionEditor testId={Number(testId)} />
            ) : (
              <div className="text-red-500">Некорректный ID теста</div>
            )}
          </div>
        </div>
      </Layout>
    );
  };

export default TestQuestionBuilder; 