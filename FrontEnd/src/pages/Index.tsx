// TestWise/src/pages/Index.tsx
import TopicAccordion from "@/components/TopicAccordion";
import Layout from "@/components/Layout";

const Index = () => {
  return (
    <Layout>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-800">
          Газотурбинные двигатели
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
          Комплексный курс изучения конструкции, принципов работы и
          эксплуатации ГТД
        </p>
      </div>

      <TopicAccordion />
    </Layout>
  );
};

export default Index;
