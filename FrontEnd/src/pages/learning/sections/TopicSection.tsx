// TestWise/src/pages/TopicSection.tsx

import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { topicData } from "@/components/TopicAccordion";
import Layout from "@/components/Layout";
import Test from "@/components/Test";
import { useTopics } from "@/context/TopicContext";
import { useAuth } from "@/context/AuthContext";
import { sectionApi, Subsection } from "@/services/sectionApi";
import { testApi, Test as TestType } from "@/services/testApi";
import { useEffect, useState } from "react";
import { getTestTypeInRussian } from "@/lib/utils";

const TopicSection = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const { topics, completeTest } = useTopics();
  const { user } = useAuth();
  const [subsections, setSubsections] = useState<Subsection[]>([]);
  const [loadingSubsections, setLoadingSubsections] = useState(false);
  const [errorSubsections, setErrorSubsections] = useState<string | null>(null);
  const [tests, setTests] = useState<TestType[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [errorTests, setErrorTests] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!sectionId) return;
    setLoadingSubsections(true);
    setErrorSubsections(null);
    setLoadingTests(true);
    setErrorTests(null);
    
    Promise.all([
      sectionApi.getSectionSubsections(Number(sectionId)),
      testApi.getTestsBySection(Number(sectionId))
    ])
      .then(([subsectionsData, testsData]) => {
        setSubsections(subsectionsData.subsections || []);
        setTests(testsData);
      })
      .catch((error) => {
        console.error("Error loading section data:", error);
        setErrorSubsections("Ошибка загрузки подразделов");
        setErrorTests("Ошибка загрузки тестов");
      })
      .finally(() => {
        setLoadingSubsections(false);
        setLoadingTests(false);
      });
  }, [sectionId]);

  const findSection = () => {
    for (const topic of topics) {
      const section = topic.children?.find((child) => child.id === sectionId);
      if (section) {
        return { topic, section };
      }
    }
    return null;
  };

  const sectionData = findSection();

  if (!sectionData) {
    return (
      <Layout>
        <div>Section not found</div>
      </Layout>
    );
  }

  const { topic, section } = sectionData;

  const handleTestComplete = () => {
    if (section.isTest && section.testType) {
      completeTest(topic.id, section.id, section.testType);
    }
    navigate(-1);
  };

  return (
    <Layout>
      <div>
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">{section.title}</h1>
          {(user?.role === "admin" || user?.role === "teacher") && (
            <Button
              variant={editMode ? "default" : "outline"}
              onClick={() => setEditMode((e) => !e)}
              className="flex items-center gap-2"
            >
              {editMode ? "Завершить" : "Редактировать"}
            </Button>
          )}
        </div>
        {('pdfUrl' in section) && section.pdfUrl && (
          <Link to={`/section/${section.id}/pdf`}>
            <Button variant="outline" className="mb-4">Открыть PDF-файл</Button>
          </Link>
        )}
        {section.isTest ? (
          <Test
            testType={section.testType || "final"}
            onComplete={handleTestComplete}
          />
        ) : (
          <div className="prose max-w-none">
            <p>{section.content}</p>
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-2">Подразделы</h2>
              {loadingSubsections && <div>Загрузка подразделов...</div>}
              {errorSubsections && <div className="text-red-500">{errorSubsections}</div>}
              {!loadingSubsections && !errorSubsections && subsections.length === 0 && (
                <div className="text-gray-500">Нет подразделов</div>
              )}
              <ul className="space-y-4">
                {subsections.map((sub) => (
                  <li key={sub.id} className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="text-lg font-bold mb-1">{sub.title}</h3>
                    {sub.content && <div className="mb-2">{sub.content}</div>}
                    {sub.file_path && (
                      <a href={sub.file_path} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Скачать файл</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Тесты секции */}
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-2">Тесты</h2>
              {loadingTests && <div>Загрузка тестов...</div>}
              {errorTests && <div className="text-red-500">{errorTests}</div>}
              {!loadingTests && !errorTests && tests.length === 0 && (
                <div className="text-gray-500">Нет тестов</div>
              )}
              <ul className="space-y-4">
                {tests.map((test) => {
                  const questionCount = test.questions?.length || 0;
                  return (
                    <li key={test.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold mb-1">{test.title}</h3>
                          <div className="text-sm text-gray-600">
                            Тип: {getTestTypeInRussian(test.type)}
                            {test.duration && ` • Время: ${test.duration} мин`}
                            <div>Вопросов: {questionCount} (Целевой порог: 10)</div>
                            {test.last_score !== null && test.last_score !== undefined && (
                              <div>Последний результат: {test.last_score}%</div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/test/${test.id}`)}
                          >
                            Пройти тест
                          </Button>
                          {(user?.role === "admin" || user?.role === "teacher") && editMode && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-blue-600"
                              onClick={() => navigate(`/test/${test.id}/edit`)}
                              title="Редактировать тест"
                            >
                              <Pencil className="w-5 h-5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TopicSection; 