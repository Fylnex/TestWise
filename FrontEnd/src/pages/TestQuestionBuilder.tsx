import { useParams, useNavigate } from "react-router-dom";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TestQuestionBuilder = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold mb-4">Конструктор вопросов для теста</h1>
        <div className="mb-4 text-muted-foreground text-sm">
          Здесь вы можете визуально добавлять, редактировать и удалять вопросы теста. Для каждого вопроса выберите тип, варианты ответа и правильный ответ. Вопросы появятся в тесте в том порядке, в котором вы их добавите.
        </div>
        {testId ? (
          <QuestionEditor testId={Number(testId)} />
        ) : (
          <div className="text-red-500">Некорректный ID теста</div>
        )}
      </div>
    </Layout>
  );
};

export default TestQuestionBuilder; 