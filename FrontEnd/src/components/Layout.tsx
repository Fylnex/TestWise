// TestWise/src/components/Layout.tsx

import Header from "@/components/Header";
import Breadcrumbs from "./Breadcrumbs";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <Breadcrumbs />

      <main className="container mx-auto px-6 pt-4 pb-8 flex-grow">
        {children}
      </main>

      <footer className="bg-slate-900 text-white py-6 mt-auto">
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

export default Layout; 