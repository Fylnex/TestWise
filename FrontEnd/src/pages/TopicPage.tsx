// TestWise/src/pages/TopicPage.tsx
// -*- coding: utf-8 -*-
// """Страница темы в TestWise.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Отображает информацию о теме, ее секциях, подсекциях и тестах,
// а также предоставляет интерфейс для создания секций и тестов
// для администраторов и учителей.
// """

import React, {useEffect, useState} from "react";
import {Link, useParams} from "react-router-dom";
import Layout from "@/components/Layout";
import { Section, Topic, topicApi } from "@/services/topicApi";
import { Test, testApi } from "@/services/testApi";
import { sectionApi, Subsection } from "@/services/sectionApi";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TopicPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const { user } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  // Модалки и формы
  const [openSection, setOpenSection] = useState(false);
  const [openTest, setOpenTest] = useState(false);
  const [sectionForm, setSectionForm] = useState({ title: '', description: '', order: 0, content: '' });
  const [testForm, setTestForm] = useState({ title: '', type: 'hinted', duration: '', question_ids: '' });
  const [creatingSection, setCreatingSection] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);
  const [errorSection, setErrorSection] = useState<string | null>(null);
  const [errorTest, setErrorTest] = useState<string | null>(null);

  const [subsectionsMap, setSubsectionsMap] = useState<
    Record<number, Subsection[]>
  >({});

  useEffect(() => {
    if (!topicId) return;
    setLoading(true);
    Promise.all([
      topicApi.getTopic(Number(topicId)),
      topicApi.getSectionsByTopic(Number(topicId)),
      testApi.getTestsByTopic(Number(topicId)),
    ])
      .then(async ([topicData, sectionsData, testsData]) => {
        setTopic(topicData);
        setSections(sectionsData.sort((a, b) => a.order - b.order));
        setTests(testsData);
        // Загружаем подсекции для каждой секции
        const subsMap: Record<number, Subsection[]> = {};
        await Promise.all(
          sectionsData.map(async (section) => {
            try {
              const res = await sectionApi.getSectionSubsections(section.id);
              subsMap[section.id] = res.subsections || [];
            } catch (error) {
              console.error(
                `Failed to load subsections for section ${section.id}:`,
                error,
              );
              subsMap[section.id] = [];
            }
          }),
        );
        setSubsectionsMap(subsMap);
      })
      .catch((error) => console.error("Error loading topic data:", error))
      .finally(() => setLoading(false));
  }, [topicId]);

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingSection(true);
    setErrorSection(null);
    try {
      const newSection = await topicApi.createSection({
        ...sectionForm,
        topic_id: Number(topicId),
        order: Number(sectionForm.order),
      });
      setSections((prev) => [...prev, newSection].sort((a, b) => a.order - b.order));
      setSectionForm({ title: '', description: '', order: 0, content: '' });
      setOpenSection(false);
    } catch (err) {
      setErrorSection('Ошибка при создании секции');
    } finally {
      setCreatingSection(false);
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTest(true);
    setErrorTest(null);
    try {
      const newTest = await testApi.createTest({
        ...testForm,
        topic_id: Number(topicId),
        duration: testForm.duration ? Number(testForm.duration) : null,
        question_ids: testForm.question_ids
          ? testForm.question_ids.split(',').map((id) => Number(id.trim()))
          : undefined,
      });
      setTests((prev) => [...prev, newTest]);
      setTestForm({ title: '', type: 'hinted', duration: '', question_ids: '' });
      setOpenTest(false);
    } catch (err) {
      setErrorTest('Ошибка при создании теста');
    } finally {
      setCreatingTest(false);
    }
  };

  if (loading) {
    return <Layout><div className="text-center py-10">Загрузка...</div></Layout>;
  }
  if (!topic) {
    return <Layout><div className="text-center py-10">Тема не найдена</div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-800">{topic.title}</h1>
        {topic.description && (
          <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
            {topic.description}
          </p>
        )}
      </div>
      {(user?.role === "admin" || user?.role === "teacher") && (
        <div className="flex gap-4 justify-center mb-8">
          <Dialog open={openSection} onOpenChange={setOpenSection}>
            <DialogTrigger asChild>
              <Button variant="outline">Добавить секцию</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать секцию</DialogTitle>
                <DialogDescription>
                  Введите данные для новой секции.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSection} className="space-y-4">
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Название секции"
                  value={sectionForm.title}
                  onChange={(e) =>
                    setSectionForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                />
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Порядок (число)"
                  type="number"
                  value={sectionForm.order}
                  onChange={(e) =>
                    setSectionForm((f) => ({
                      ...f,
                      order: Number(e.target.value),
                    }))
                  }
                  required
                />
                <textarea
                  className="w-full border rounded px-3 py-2"
                  placeholder="Описание секции"
                  value={sectionForm.description}
                  onChange={(e) =>
                    setSectionForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                />
                <textarea
                  className="w-full border rounded px-3 py-2"
                  placeholder="Контент секции (необязательно)"
                  value={sectionForm.content}
                  onChange={(e) =>
                    setSectionForm((f) => ({ ...f, content: e.target.value }))
                  }
                />
                {errorSection && (
                  <div className="text-red-500 text-sm">{errorSection}</div>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={creatingSection}>
                    {creatingSection ? "Создание..." : "Создать"}
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Отмена
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={openTest} onOpenChange={setOpenTest}>
            <DialogTrigger asChild>
              <Button variant="outline">Добавить тест</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать тест</DialogTitle>
                <DialogDescription>
                  Введите данные для нового теста.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTest} className="space-y-4">
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Название теста"
                  value={testForm.title}
                  onChange={(e) =>
                    setTestForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                />
                <select
                  className="w-full border rounded px-3 py-2"
                  value={testForm.type}
                  onChange={(e) =>
                    setTestForm((f) => ({ ...f, type: e.target.value }))
                  }
                  required
                >
                  <option value="hinted">С подсказками</option>
                  <option value="section_final">Финальный по секции</option>
                  <option value="global_final">Глобальный финальный</option>
                </select>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Длительность (сек, 0 — без лимита)"
                  type="number"
                  value={testForm.duration}
                  onChange={(e) =>
                    setTestForm((f) => ({ ...f, duration: e.target.value }))
                  }
                />
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="ID вопросов через запятую (необязательно)"
                  value={testForm.question_ids}
                  onChange={(e) =>
                    setTestForm((f) => ({ ...f, question_ids: e.target.value }))
                  }
                />
                {errorTest && (
                  <div className="text-red-500 text-sm">{errorTest}</div>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={creatingTest}>
                    {creatingTest ? "Создание..." : "Создать"}
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Отмена
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}
      <Accordion type="single" collapsible className="w-full max-w-2xl mx-auto">
        {sections.map((section) => (
          <AccordionItem key={section.id} value={section.id.toString()}>
            <AccordionTrigger>
              <span>{section.title}</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="mb-2 text-slate-700">
                {section.description || section.content}
              </div>
              {/* Подсекции */}
              {subsectionsMap[section.id] &&
                subsectionsMap[section.id].length > 0 && (
                  <div className="mt-4">
                    <div className="font-semibold mb-2">Подсекции:</div>
                    <ul className="list-disc pl-6">
                      {subsectionsMap[section.id].map((sub) => (
                        <li key={sub.id}>{sub.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
              <Link to={`/section/${section.id}`}>
                <Button variant="outline">Перейти к секции</Button>
              </Link>
            </AccordionContent>
          </AccordionItem>
        ))}
        {tests.length > 0 && (
          <>
            <div className="mt-6 mb-2 font-semibold text-slate-700">
              Тесты по теме
            </div>
            {tests.map((test) => (
              <AccordionItem key={test.id} value={`test-${test.id}`}>
                <AccordionTrigger>
                  <span>{test.title}</span>
                  {/* Здесь можно добавить тип теста и статус */}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="mb-2 text-slate-700">Тип: {test.type}</div>
                  <Link to={`/test/${test.id}`}>
                    <Button variant="outline">Перейти к тесту</Button>
                  </Link>
                </AccordionContent>
              </AccordionItem>
            ))}
          </>
        )}
      </Accordion>
    </Layout>
  );
};

export default TopicPage;