import React from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function About_VM() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  return (
    <Layout>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto max-w-2xl px-6 py-12 animate-fade-in-up">
          <h1 className="text-2xl font-medium mb-8 text-gray-900">О платформе ЛайнТест</h1>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-medium mb-2 text-gray-900">Что это?</h2>
              <p className="text-gray-600 leading-relaxed">
                ЛайнТест — образовательная платформа для обучения и тестирования. 
                Позволяет создавать учебные материалы, проводить тесты и отслеживать прогресс студентов.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-3 text-gray-900">Основные возможности</h2>
              <ul className="space-y-1 text-gray-600">
                <li>• Создание учебных тем и разделов</li>
                <li>• Загрузка материалов (текст, PDF, изображения)</li>
                <li>• Создание тестов с автоматической проверкой</li>
                <li>• Отслеживание результатов студентов</li>
                <li>• Управление группами и пользователями</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-2 text-gray-900">Контакты</h2>
              <div className="space-y-1 text-gray-600">
                <div>Email: support@testwise.com</div>
                <div>Телефон: +7 (999) 123-45-67</div>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={() => navigate(isAuthenticated ? '/' : '/login')}
                size="lg"
                className="transition-transform duration-200 ease-in-out hover:scale-105 hover:shadow-lg"
              >
                {isAuthenticated ? 'Перейти к обучению' : 'Войти в систему'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 