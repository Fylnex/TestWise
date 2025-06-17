// TestWise/src/pages/About.tsx
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function About() {
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">О нас</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Наша миссия</CardTitle>
              <CardDescription>Что мы делаем и зачем</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                ЛайнТест - это инновационная платформа для обучения и тестирования, 
                созданная с целью сделать процесс обучения более эффективным и увлекательным.
              </p>
              <p className="text-gray-600">
                Мы стремимся помочь студентам достичь их образовательных целей, 
                предоставляя качественные материалы и удобные инструменты для проверки знаний.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Наши преимущества</CardTitle>
              <CardDescription>Почему стоит выбрать нас</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Интерактивные тесты и задания
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Подробная статистика прогресса
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Удобный интерфейс
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Поддержка 24/7
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Контакты</CardTitle>
              <CardDescription>Свяжитесь с нами</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-gray-600">support@testwise.com</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Телефон</h3>
                  <p className="text-gray-600">+7 (999) 123-45-67</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 