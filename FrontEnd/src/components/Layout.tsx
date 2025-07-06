// TestWise/src/components/Layout.tsx

import Header from "@/components/Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-grow pb-32">
        {children}
      </main>

      <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-8 mt-auto border-t border-slate-700">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold mb-3 text-white">ЛайнТест</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Инновационная платформа для обучения и тестирования. 
                Создавайте, изучайте и оценивайте знания эффективно.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3 text-white">Быстрые ссылки</h3>
              <div className="flex flex-col space-y-2 text-sm">
                <a href="/topics" className="text-slate-300 hover:text-white transition-colors">
                  Все темы
                </a>
                <a href="/about" className="text-slate-300 hover:text-white transition-colors">
                  О нас
                </a>
                <a href="/contact" className="text-slate-300 hover:text-white transition-colors">
                  Контакты
                </a>
              </div>
            </div>
            <div className="text-center md:text-right">
              <h3 className="text-lg font-semibold mb-3 text-white">Поддержка</h3>
              <div className="flex flex-col space-y-2 text-sm">
                <a href="/privacy" className="text-slate-300 hover:text-white transition-colors">
                  Политика конфиденциальности
                </a>
                <a href="/terms" className="text-slate-300 hover:text-white transition-colors">
                  Условия использования
                </a>
                <a href="/contact" className="text-slate-300 hover:text-white transition-colors">
                  Помощь
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-6 text-center">
            <p className="text-sm text-slate-400">
              © 2025 ЛайнТест. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 