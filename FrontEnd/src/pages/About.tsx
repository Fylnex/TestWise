// TestWise/src/pages/About.tsx
import React from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function About() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  return (
    <Layout>
      <section className="relative bg-gradient-to-br from-slate-50 to-white min-h-[90vh] flex flex-col justify-center items-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none select-none opacity-10" aria-hidden>
          <svg width="100%" height="100%" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#6366f1" fillOpacity="0.2" d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,133.3C840,107,960,85,1080,101.3C1200,117,1320,171,1380,197.3L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
          </svg>
        </div>
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
            Добро пожаловать в <span className="text-indigo-600">ЛайнТест</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 mb-8 max-w-2xl mx-auto">
            Платформа нового поколения для обучения, тестирования и развития. Мы объединяем технологии, дизайн и педагогику, чтобы сделать ваш образовательный путь вдохновляющим и эффективным.
          </p>
          <Button size="lg" className="text-lg px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-transform" onClick={() => navigate('/')}>Начать обучение</Button>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Наша миссия</h2>
            <p className="text-lg text-slate-700 mb-4">
              Мы верим, что образование должно быть доступным, современным и вдохновляющим. ЛайнТест создан для того, чтобы каждый мог раскрыть свой потенциал, учиться с удовольствием и достигать выдающихся результатов.
            </p>
            <ul className="space-y-3 text-slate-700 text-base mt-6">
              <li className="flex items-center"><span className="text-indigo-600 mr-2 text-xl">•</span> Персонализированные траектории обучения</li>
              <li className="flex items-center"><span className="text-indigo-600 mr-2 text-xl">•</span> Интерактивные тесты и мгновенная обратная связь</li>
              <li className="flex items-center"><span className="text-indigo-600 mr-2 text-xl">•</span> Аналитика и поддержка на каждом этапе</li>
            </ul>
          </div>
          <div className="flex justify-center">
            <img src="/public/placeholder.svg" alt="ЛайнТест" className="rounded-2xl shadow-xl w-full max-w-md" />
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-indigo-50 to-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-slate-900">Почему выбирают нас?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center text-center hover:shadow-xl transition-shadow">
              <span className="text-indigo-600 text-4xl mb-4">🚀</span>
              <h3 className="font-semibold text-xl mb-2">Скорость и удобство</h3>
              <p className="text-slate-600">Молниеносный интерфейс, мгновенная проверка знаний, всё под рукой — на любом устройстве.</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center text-center hover:shadow-xl transition-shadow">
              <span className="text-indigo-600 text-4xl mb-4">🔒</span>
              <h3 className="font-semibold text-xl mb-2">Безопасность и приватность</h3>
              <p className="text-slate-600">Ваши данные защищены, а прогресс — только ваш. Мы используем лучшие практики безопасности.</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center text-center hover:shadow-xl transition-shadow">
              <span className="text-indigo-600 text-4xl mb-4">🤝</span>
              <h3 className="font-semibold text-xl mb-2">Поддержка и сообщество</h3>
              <p className="text-slate-600">Настоящая поддержка 24/7 и активное сообщество единомышленников — вы не одни на пути к успеху.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center order-2 md:order-1">
            <img src="/public/placeholder.svg" alt="Команда ЛайнТест" className="rounded-2xl shadow-xl w-full max-w-md" />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Наша команда</h2>
            <p className="text-lg text-slate-700 mb-4">
              Мы — команда экспертов в образовании, IT и дизайне. Каждый из нас вкладывает душу в развитие ЛайнТест, чтобы вы получали только лучшее.
            </p>
            <ul className="space-y-3 text-slate-700 text-base mt-6">
              <li className="flex items-center"><span className="text-indigo-600 mr-2 text-xl">•</span> Педагоги с опытом работы в топовых школах и вузах</li>
              <li className="flex items-center"><span className="text-indigo-600 mr-2 text-xl">•</span> Разработчики, создающие современные и надёжные решения</li>
              <li className="flex items-center"><span className="text-indigo-600 mr-2 text-xl">•</span> Дизайнеры, вдохновлённые лучшими мировыми практиками</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-indigo-100 to-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">Связаться с нами</h2>
          <p className="text-lg text-slate-700 mb-8">Остались вопросы? Мы всегда на связи!</p>
          <div className="flex flex-col md:flex-row justify-center gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-2">Email</h3>
              <a href="mailto:support@testwise.com" className="text-indigo-600 hover:underline text-lg">support@testwise.com</a>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Телефон</h3>
              <a href="tel:+79991234567" className="text-indigo-600 hover:underline text-lg">+7 (999) 123-45-67</a>
            </div>
          </div>
          <Button size="lg" className="text-lg px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-transform"
            onClick={() => navigate(isAuthenticated ? '/' : '/login')}
          >
            Присоединиться к ЛайнТест
          </Button>
        </div>
      </section>
    </Layout>
  );
} 