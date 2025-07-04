// TestWise/src/pages/TopicSection.tsx

import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { topicData } from "@/components/TopicAccordion";
import Layout from "@/components/Layout";
import Test from "@/components/Test";
import { useTopics } from "@/context/TopicContext";
import { sectionApi, Subsection } from "@/services/sectionApi";
import { useEffect, useState } from "react";

const TopicSection = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const { topics, completeTest } = useTopics();
  const [subsections, setSubsections] = useState<Subsection[]>([]);
  const [loadingSubsections, setLoadingSubsections] = useState(false);
  const [errorSubsections, setErrorSubsections] = useState<string | null>(null);

  useEffect(() => {
    if (!sectionId) return;
    setLoadingSubsections(true);
    setErrorSubsections(null);
    sectionApi.getSectionSubsections(Number(sectionId))
      .then((data) => {
        setSubsections(data.subsections || []);
      })
      .catch(() => {
        setErrorSubsections("Ошибка загрузки подразделов");
      })
      .finally(() => setLoadingSubsections(false));
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
        <h1 className="text-3xl font-bold mb-4">{section.title}</h1>
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
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TopicSection; 