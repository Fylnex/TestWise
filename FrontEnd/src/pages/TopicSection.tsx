// TestWise/src/pages/TopicSection.tsx

import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { topicData } from "@/components/TopicAccordion";
import Layout from "@/components/Layout";
import Test from "@/components/Test";
import { useTopics } from "@/context/TopicContext";

const TopicSection = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const { topics, completeTest } = useTopics();

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
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TopicSection; 