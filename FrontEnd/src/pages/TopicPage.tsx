// TestWise/src/pages/TopicPage.tsx
// -*- coding: utf-8 -*-
// """Страница темы в TestWise.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Отображает информацию о теме, ее секциях, подсекциях и тестах,
// а также предоставляет интерфейс для создания секций и тестов
// для администраторов и учителей.
// """

import React, {useEffect, useState} from "react";
import {Link, useParams, useNavigate} from "react-router-dom";
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
import { Dialog as Modal, DialogContent as ModalContent, DialogHeader as ModalHeader, DialogTitle as ModalTitle, DialogClose as ModalClose } from '@/components/ui/dialog';
import QuestionEditor from '@/components/admin/QuestionEditor';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import Footer from '@/components/Layout';

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

  const [subsectionsMap, setSubsectionsMap] = useState<Record<number, any[]>>({});

  const [openSubsection, setOpenSubsection] = useState<Record<number, boolean>>({});
  const [subsectionForm, setSubsectionForm] = useState<Record<number, any>>({});
  const [errorSubsection, setErrorSubsection] = useState<Record<number, string | null>>({});
  const [creatingSubsection, setCreatingSubsection] = useState<Record<number, boolean>>({});

  const [openQuestionsEditor, setOpenQuestionsEditor] = useState<number | null>(null);

  const [editMode, setEditMode] = useState(false);

  const [openSectionTestId, setOpenSectionTestId] = useState<number | null>(null);
  const [sectionTestForm, setSectionTestForm] = useState({ title: '', type: 'hinted', duration: '', question_ids: '' });
  const [creatingSectionTest, setCreatingSectionTest] = useState(false);
  const [errorSectionTest, setErrorSectionTest] = useState<string | null>(null);

  const [deleteInput, setDeleteInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();

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

  const handleOpenSubsection = (sectionId: number) => {
    setOpenSubsection((prev) => ({ ...prev, [sectionId]: true }));
    setSubsectionForm((prev) => ({ ...prev, [sectionId]: { title: '', order: 0, content: '', type: 'default', section_id: sectionId } }));
    setErrorSubsection((prev) => ({ ...prev, [sectionId]: null }));
  };

  const handleCloseSubsection = (sectionId: number) => {
    setOpenSubsection((prev) => ({ ...prev, [sectionId]: false }));
  };

  const handleCreateSubsection = async (e: React.FormEvent, sectionId: number) => {
    e.preventDefault();
    setCreatingSubsection((prev) => ({ ...prev, [sectionId]: true }));
    setErrorSubsection((prev) => ({ ...prev, [sectionId]: null }));
    try {
      const newSubsection = await topicApi.createSubsection({
        ...subsectionForm[sectionId],
        section_id: sectionId,
        order: Number(subsectionForm[sectionId]?.order) || 0,
      });
      setSubsectionsMap((prev) => ({
        ...prev,
        [sectionId]: [...(prev[sectionId] || []), newSubsection].sort((a, b) => a.order - b.order),
      }));
      setSubsectionForm((prev) => ({ ...prev, [sectionId]: { title: '', order: 0, content: '', type: 'default', section_id: sectionId } }));
      setOpenSubsection((prev) => ({ ...prev, [sectionId]: false }));
    } catch (err) {
      setErrorSubsection((prev) => ({ ...prev, [sectionId]: 'Ошибка при создании подсекции' }));
    } finally {
      setCreatingSubsection((prev) => ({ ...prev, [sectionId]: false }));
    }
  };

  const handleCreateSectionTest = async (e: React.FormEvent, sectionId: number) => {
    e.preventDefault();
    setCreatingSectionTest(true);
    setErrorSectionTest(null);
    try {
      const newTest = await testApi.createTest({
        ...sectionTestForm,
        section_id: sectionId,
        topic_id: Number(topicId),
        duration: sectionTestForm.duration ? Number(sectionTestForm.duration) : null,
        question_ids: sectionTestForm.question_ids
          ? sectionTestForm.question_ids.split(',').map((id) => Number(id.trim()))
          : undefined,
      });
      // Добавляем тест только в секцию
      setSections((prev) => prev.map(s => s.id === sectionId ? { ...s, tests: [...(s.tests || []), newTest] } : s));
      setSectionTestForm({ title: '', type: 'hinted', duration: '', question_ids: '' });
      setOpenSectionTestId(null);
    } catch (err) {
      setErrorSectionTest('Ошибка при создании теста для секции');
    } finally {
      setCreatingSectionTest(false);
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    try {
      await topicApi.deleteSection(sectionId);
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
    } catch {
      alert('Ошибка удаления секции');
    }
  };

  const handleDeleteSubsection = async (subId: number, sectionId: number) => {
    if (!window.confirm('Удалить подсекцию?')) return;
    try {
      await topicApi.deleteSubsection(subId);
      setSubsectionsMap((prev) => ({ ...prev, [sectionId]: prev[sectionId].filter((s) => s.id !== subId) }));
    } catch {
      alert('Ошибка удаления подсекции');
    }
  };

  const handleDeleteSectionTest = async (testId: number, sectionId: number) => {
    if (!window.confirm('Удалить тест?')) return;
    try {
      await testApi.deleteTest(testId);
      setSections((prev) => prev.map(s => s.id === sectionId ? { ...s, tests: (s.tests || []).filter((t: any) => t.id !== testId) } : s));
    } catch {
      alert('Ошибка удаления теста');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50"><Header /><div className="container mx-auto py-10 text-center text-gray-400">Загрузка...</div></div>;
  }
  if (!topic) {
    return <div className="min-h-screen bg-gray-50"><Header /><div className="container mx-auto py-10 text-center text-gray-400">Тема не найдена</div></div>;
  }

  const isEmpty = sections.length === 0 && tests.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="container mx-auto w-full max-w-4xl px-4 flex flex-col flex-1 mb-16">
        <div className="pt-6 pb-2 flex items-center justify-between">
          <Breadcrumbs />
          {(user?.role === 'admin' || user?.role === 'teacher' || user?.id === topic.creator_id) && (
            <Button size="sm" variant={editMode ? 'default' : 'outline'} onClick={() => setEditMode(e => !e)}>
              {editMode ? 'Завершить' : 'Редактировать'}
            </Button>
          )}
        </div>
        <div className="mb-8 mt-2">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-sans mb-2">{topic.title}</h1>
          {topic.description && <p className="text-lg text-gray-600 max-w-2xl font-sans mb-2">{topic.description}</p>}
        </div>
        {(user?.role === 'admin' || user?.role === 'teacher') && editMode && (
          <div className="mb-8 flex gap-4 flex-wrap">
            <Button variant="outline" className="rounded-full border-[#3A86FF] text-[#3A86FF]" onClick={() => setOpenSection(true)}>
              <PlusCircle className="mr-2 h-5 w-5" /> Добавить секцию
            </Button>
            <Button variant="outline" className="rounded-full border-[#3A86FF] text-[#3A86FF]" onClick={() => navigate(`/test/create/topic/${topic.id}`)}>
              <PlusCircle className="mr-2 h-5 w-5" /> Добавить тест
            </Button>
          </div>
        )}
        <Accordion type="multiple" className="bg-transparent" defaultValue={sections.map(s => String(s.id))}>
          {sections.map((section) => (
            <AccordionItem key={section.id} value={String(section.id)} className="bg-white rounded-2xl shadow-sm mb-4 border border-gray-200">
              <AccordionTrigger className="text-xl font-semibold px-6 py-4 text-left text-gray-900 hover:text-[#3A86FF] focus:outline-none flex items-center gap-2">
                <span className="flex-1 cursor-pointer select-none hover:underline" onClick={e => { e.stopPropagation(); navigate(`/section/tree/${section.id}`); }}>{section.title}</span>
                {/* Иконка раскрытия/сворачивания */}
                <span className="ml-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  {/* Иконка будет автоматически добавлена AccordionTrigger */}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                {section.description && <p className="text-gray-600 mb-2">{section.description}</p>}
                {/* Подсекции */}
                {subsectionsMap[section.id]?.length > 0 && (
                  <div className="mb-2">
                    <div className="font-semibold text-gray-700 mb-1">Подразделы:</div>
                    <ul className="flex flex-col gap-2">
                      {subsectionsMap[section.id].map(sub => (
                        <li key={sub.id} className="bg-gray-50 rounded-xl px-4 py-2 flex items-center justify-between">
                          <span className="text-gray-800 font-sans">{sub.title}</span>
                          {(user?.role === 'admin' || user?.role === 'teacher') && editMode && (
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteSubsection(sub.id, section.id)} title="Удалить подсекцию">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Тесты секции */}
                {section.tests?.length > 0 && (
                  <div className="mb-2">
                    <div className="font-semibold text-gray-700 mb-1">Тесты:</div>
                    <ul className="flex flex-col gap-2">
                      {section.tests.map(test => (
                        <li key={test.id} className="bg-gray-50 rounded-xl px-4 py-2 flex items-center justify-between">
                          <span className="text-gray-800 font-sans">{test.title}</span>
                          {(user?.role === 'admin' || user?.role === 'teacher') && editMode && (
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteSectionTest(test.id, section.id)} title="Удалить тест">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Кнопки добавления в секцию */}
                {(user?.role === 'admin' || user?.role === 'teacher') && editMode && (
                  <div className="mt-2 flex gap-3 flex-wrap">
                    <Button variant="outline" className="flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full border-[#3A86FF] text-[#3A86FF]" onClick={() => navigate(`/subsection/create/${section.id}`)}>
                      <PlusCircle className="h-4 w-4" /> <span>Секцию</span>
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full border-[#3A86FF] text-[#3A86FF]" onClick={() => navigate(`/test/create/section/${section.id}`)}>
                      <PlusCircle className="h-4 w-4" /> <span>Тест</span>
                    </Button>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {/* Тесты по теме */}
        {tests.length > 0 && (
          <div className="mt-10">
            <div className="font-semibold text-gray-700 mb-2 text-lg">Тесты по теме:</div>
            <div className="space-y-4">
              {tests.map(test => (
                <div key={test.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between border border-gray-200">
                  <div>
                    <div className="font-semibold text-lg text-gray-900 font-sans">{test.title}</div>
                    <div className="text-gray-500 text-sm">Тип: {test.type}</div>
                  </div>
                  {(user?.role === 'admin' || user?.role === 'teacher') && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-full border-[#3A86FF] text-[#3A86FF]" onClick={() => setOpenQuestionsEditor(test.id)}>
                        Редактировать вопросы
                      </Button>
                      {editMode && (
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={async () => { await testApi.deleteTest(test.id); setTests(prev => prev.filter(t => t.id !== test.id)); }} title="Удалить тест">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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

export default TopicPage;