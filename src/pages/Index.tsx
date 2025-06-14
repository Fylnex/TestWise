import Header from "@/components/Header";
import TopicAccordion from "@/components/TopicAccordion";

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            Газотурбинные двигатели
          </h1>
          <p className="text-slate-600 mt-2">
            Комплексный курс изучения конструкции, принципов работы и
            эксплуатации ГТД
          </p>
        </div>

        <TopicAccordion />
      </main>

      <footer className="bg-slate-900 text-white py-6 mt-16">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-slate-400 mb-4">
            © 2025. Все права защищены.
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <a
              href="/privacy"
              className="text-purple-300 hover:text-purple-200 transition-colors"
            >
              Политика конфиденциальности
            </a>
            <a
              href="/terms"
              className="text-purple-300 hover:text-purple-200 transition-colors"
            >
              Условия использования
            </a>
            <a
              href="/contact"
              className="text-purple-300 hover:text-purple-200 transition-colors"
            >
              Контакты
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
