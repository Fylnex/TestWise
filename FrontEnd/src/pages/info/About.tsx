// TestWise/src/pages/About.tsx
import React from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  Rocket, 
  Shield, 
  Users, 
  BookOpen, 
  Target, 
  Zap, 
  CheckCircle, 
  Mail, 
  Phone, 
  ArrowRight,
  GraduationCap,
  Code,
  Palette,
  TrendingUp,
  Award,
  Heart
} from 'lucide-react';

export default function About() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen flex flex-col justify-center items-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-white/20 shadow-lg mb-6">
              <BookOpen className="w-5 h-5 text-indigo-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Образовательная платформа нового поколения</span>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            Добро пожаловать в{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              ЛайнТест
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
            Платформа нового поколения для обучения, тестирования и развития. 
            Мы объединяем технологии, дизайн и педагогику, чтобы сделать ваш 
            образовательный путь вдохновляющим и эффективным.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
              onClick={() => navigate('/')}
            >
              Начать обучение
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4 rounded-full border-2 border-gray-300 hover:border-indigo-600 hover:bg-indigo-50 transition-all duration-300"
              onClick={() => navigate('/topics')}
            >
              Изучить темы
            </Button>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 bg-indigo-100 rounded-full">
                <Target className="w-5 h-5 text-indigo-600 mr-2" />
                <span className="text-sm font-semibold text-indigo-700">Наша миссия</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Преобразуем образование через{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  технологии
                </span>
              </h2>
            </div>
            
            <p className="text-xl text-gray-600 leading-relaxed">
              Мы верим, что образование должно быть доступным, современным и вдохновляющим. 
              ЛайнТест создан для того, чтобы каждый мог раскрыть свой потенциал, 
              учиться с удовольствием и достигать выдающихся результатов.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Персонализированные траектории</h3>
                  <p className="text-gray-600">Адаптивное обучение под ваши потребности и темп</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Интерактивные тесты</h3>
                  <p className="text-gray-600">Мгновенная обратная связь и детальная аналитика</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Поддержка на каждом этапе</h3>
                  <p className="text-gray-600">Комплексная помощь в достижении ваших целей</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl p-8 shadow-2xl">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <TrendingUp className="w-8 h-8 text-indigo-600 mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">95%</h3>
                  <p className="text-sm text-gray-600">Успешность обучения</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <Users className="w-8 h-8 text-purple-600 mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">10K+</h3>
                  <p className="text-sm text-gray-600">Активных студентов</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <BookOpen className="w-8 h-8 text-pink-600 mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">500+</h3>
                  <p className="text-sm text-gray-600">Учебных материалов</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <Award className="w-8 h-8 text-green-600 mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">4.9/5</h3>
                  <p className="text-sm text-gray-600">Рейтинг платформы</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-100 rounded-full mb-6">
              <Zap className="w-5 h-5 text-indigo-600 mr-2" />
              <span className="text-sm font-semibold text-indigo-700">Почему выбирают нас</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Инновации в каждом{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                пикселе
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Мы создали платформу, которая сочетает в себе передовые технологии 
              и интуитивный дизайн для максимальной эффективности обучения.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Скорость и удобство</h3>
              <p className="text-gray-600 leading-relaxed">
                Молниеносный интерфейс, мгновенная проверка знаний, всё под рукой — 
                на любом устройстве. Учитесь в своем темпе, где и когда удобно.
              </p>
            </div>
            
            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Безопасность и приватность</h3>
              <p className="text-gray-600 leading-relaxed">
                Ваши данные защищены, а прогресс — только ваш. Мы используем 
                лучшие практики безопасности и шифрования данных.
              </p>
            </div>
            
            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Поддержка и сообщество</h3>
              <p className="text-gray-600 leading-relaxed">
                Настоящая поддержка 24/7 и активное сообщество единомышленников — 
                вы не одни на пути к успеху. Присоединяйтесь к нашему сообществу.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 bg-pink-100 rounded-full">
                  <Heart className="w-5 h-5 text-pink-600 mr-2" />
                  <span className="text-sm font-semibold text-pink-700">Наша команда</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  Эксперты с{' '}
                  <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    страстью
                  </span>
                </h2>
              </div>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Мы — команда экспертов в образовании, IT и дизайне. Каждый из нас 
                вкладывает душу в развитие ЛайнТест, чтобы вы получали только лучшее.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Педагоги-эксперты</h3>
                    <p className="text-gray-600">Опыт работы в топовых школах и вузах, авторские методики обучения</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <Code className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Разработчики</h3>
                    <p className="text-gray-600">Создание современных и надёжных решений с использованием передовых технологий</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Дизайнеры</h3>
                    <p className="text-gray-600">Вдохновлённые лучшими мировыми практиками UX/UI дизайна</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-1 gap-6">
                  
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                      <div>
                        <h4 className="font-bold text-gray-900">Переятенцев Артем</h4>
                        <p className="text-sm text-gray-600">Разработчик</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full"></div>
                      <div>
                        <h4 className="font-bold text-gray-900">Чертков Даниил</h4>
                        <p className="text-sm text-gray-600">UX/UI дизайнер</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 bg-indigo-100 rounded-full">
                <Mail className="w-5 h-5 text-indigo-600 mr-2" />
                <span className="text-sm font-semibold text-indigo-700">Связаться с нами</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Готовы{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  начать?
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Остались вопросы? Мы всегда на связи и готовы помочь вам 
                на каждом этапе вашего образовательного пути.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                <Mail className="w-8 h-8 text-indigo-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Email</h3>
                <a 
                  href="mailto:support@testwise.com" 
                  className="text-indigo-600 hover:text-indigo-700 text-lg font-medium transition-colors"
                >
                  support@testwise.com
                </a>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                <Phone className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Телефон</h3>
                <a 
                  href="tel:+79991234567" 
                  className="text-purple-600 hover:text-purple-700 text-lg font-medium transition-colors"
                >
                  +7 (999) 123-45-67
                </a>
              </div>
            </div>
            
            <Button 
              size="lg" 
              className="text-lg px-12 py-6 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
              onClick={() => navigate(isAuthenticated ? '/' : '/login')}
            >
              Присоединиться к ЛайнТест
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
} 