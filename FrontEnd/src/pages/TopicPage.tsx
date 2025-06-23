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
    return <Layout><div className="text-center py-10">Загрузка...</div></Layout>;
  }
  if (!topic) {
    return <Layout><div className="text-center py-10">Тема не найдена</div></Layout>;
  }

  const isEmpty = sections.length === 0 && tests.length === 0;

  return (
    <Layout>
      <div className="mb-8 text-center flex flex-col items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-slate-800">{topic.title}</h1>
          {(user?.role === 'admin' || user?.id === topic.creator_id) && (
            <Button size="sm" variant={editMode ? "default" : "outline"} className="ml-2" onClick={() => setEditMode(e => !e)}>
              {editMode ? 'Завершить редактирование' : 'Редактировать'}
            </Button>
          )}
        </div>
        {topic.description && (
          <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
            {topic.description}
          </p>
        )}
      </div>
      {(user?.role === 'admin' || user?.role === 'teacher') && editMode && (
        <div className="flex justify-center mb-8">
          <Card className="w-full max-w-xl mx-auto border-2 border-dashed border-primary/40 bg-muted/40 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Добавить новый элемент</CardTitle>
              <CardDescription>Создайте новую секцию или тест для этой темы</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => setOpenSection(true)}>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Добавить секцию
                </Button>
                <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => setOpenTest(true)}>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Добавить тест
                </Button>
              </div>
            </CardContent>
          </Card>
          <Dialog open={openSection} onOpenChange={setOpenSection}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать секцию</DialogTitle>
                <DialogDescription>Введите данные для новой секции.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSection} className="space-y-4">
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Название секции"
                  value={sectionForm.title}
                  onChange={e => setSectionForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
                <textarea
                  className="w-full border rounded px-3 py-2"
                  placeholder="Описание секции"
                  value={sectionForm.description}
                  onChange={e => setSectionForm(f => ({ ...f, description: e.target.value }))}
                />
                <textarea
                  className="w-full border rounded px-3 py-2"
                  placeholder="Контент секции (необязательно)"
                  value={sectionForm.content}
                  onChange={e => setSectionForm(f => ({ ...f, content: e.target.value }))}
                />
                {errorSection && <div className="text-red-500 text-sm">{errorSection}</div>}
                <DialogFooter>
                  <Button type="submit" disabled={creatingSection}>
                    {creatingSection ? 'Создание...' : 'Создать'}
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Отмена</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={openTest} onOpenChange={setOpenTest}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать тест</DialogTitle>
                <DialogDescription>Введите данные для нового теста.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTest} className="space-y-4">
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Название теста"
                  value={testForm.title}
                  onChange={e => setTestForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
                <select
                  className="w-full border rounded px-3 py-2"
                  value={testForm.type}
                  onChange={e => setTestForm(f => ({ ...f, type: e.target.value }))}
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
                  onChange={e => setTestForm(f => ({ ...f, duration: e.target.value }))}
                />
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="ID вопросов через запятую (необязательно)"
                  value={testForm.question_ids}
                  onChange={e => setTestForm(f => ({ ...f, question_ids: e.target.value }))}
                />
                {errorTest && <div className="text-red-500 text-sm">{errorTest}</div>}
                <DialogFooter>
                  <Button type="submit" disabled={creatingTest}>
                    {creatingTest ? 'Создание...' : 'Создать'}
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Отмена</Button>
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
              {(user?.role === 'admin' || user?.role === 'teacher') && editMode && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="ml-2 text-destructive" title="Удалить секцию">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить секцию?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Это действие необратимо. Все вложенные подсекции и тесты будут удалены.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteSection(section.id)}>Удалить</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="mb-2 text-slate-700">{section.description || section.content}</div>
              {/* Add-блок для вложенных секций и тестов */}
              {(user?.role === 'admin' || user?.role === 'teacher') && editMode && (
                <div className="my-4">
                  <Card className="border border-dashed border-primary/30 bg-background/80 shadow-sm transition-shadow hover:shadow-md p-3 flex flex-col items-center gap-2">
                    <div className="w-full flex items-center gap-2 mb-1">
                      <span className="text-xs text-primary font-semibold tracking-wide uppercase">Добавить в секцию</span>
                    </div>
                    <div className="flex gap-3 w-full justify-center">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-md transition-colors h-9"
                        onClick={() => handleOpenSubsection(section.id)}
                        aria-label="Добавить вложенную секцию"
                        title="Добавить вложенную секцию"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>Секцию</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-md transition-colors h-9"
                        onClick={() => setOpenSectionTestId(section.id)}
                        aria-label="Добавить тест к секции"
                        title="Добавить тест к секции"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>Тест</span>
                      </Button>
                    </div>
                  </Card>
                  {/* Диалог создания подсекции */}
                  <Dialog open={!!openSubsection[section.id]} onOpenChange={v => { if (!v) handleCloseSubsection(section.id); }}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Создать вложенную секцию</DialogTitle>
                        <DialogDescription>Введите данные для новой вложенной секции.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={e => handleCreateSubsection(e, section.id)} className="space-y-4">
                        <input
                          className="w-full border rounded px-3 py-2"
                          placeholder="Название вложенной секции"
                          value={subsectionForm[section.id]?.title || ''}
                          onChange={e => setSubsectionForm(f => ({ ...f, [section.id]: { ...f[section.id], title: e.target.value } }))}
                          required
                        />
                        <textarea
                          className="w-full border rounded px-3 py-2"
                          placeholder="Контент вложенной секции (необязательно)"
                          value={subsectionForm[section.id]?.content || ''}
                          onChange={e => setSubsectionForm(f => ({ ...f, [section.id]: { ...f[section.id], content: e.target.value } }))}
                        />
                        {errorSubsection[section.id] && <div className="text-red-500 text-sm">{errorSubsection[section.id]}</div>}
                        <DialogFooter>
                          <Button type="submit" disabled={creatingSubsection[section.id]}>
                            {creatingSubsection[section.id] ? 'Создание...' : 'Создать'}
                          </Button>
                          <DialogClose asChild>
                            <Button type="button" variant="outline">Отмена</Button>
                          </DialogClose>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  {/* Диалог создания теста для секции */}
                  <Dialog open={openSectionTestId === section.id} onOpenChange={v => { if (!v) setOpenSectionTestId(null); }}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Создать тест для секции</DialogTitle>
                        <DialogDescription>Введите данные для нового теста этой секции.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={e => handleCreateSectionTest(e, section.id)} className="space-y-4">
                        <input
                          className="w-full border rounded px-3 py-2"
                          placeholder="Название теста"
                          value={sectionTestForm.title}
                          onChange={e => setSectionTestForm(f => ({ ...f, title: e.target.value }))}
                          required
                        />
                        <select
                          className="w-full border rounded px-3 py-2"
                          value={sectionTestForm.type}
                          onChange={e => setSectionTestForm(f => ({ ...f, type: e.target.value }))}
                          required
                        >
                          <option value="hinted">С подсказками</option>
                          <option value="section_final">Финальный по секции</option>
                        </select>
                        <input
                          className="w-full border rounded px-3 py-2"
                          placeholder="Длительность (сек, 0 — без лимита)"
                          type="number"
                          value={sectionTestForm.duration}
                          onChange={e => setSectionTestForm(f => ({ ...f, duration: e.target.value }))}
                        />
                        <input
                          className="w-full border rounded px-3 py-2"
                          placeholder="ID вопросов через запятую (необязательно)"
                          value={sectionTestForm.question_ids}
                          onChange={e => setSectionTestForm(f => ({ ...f, question_ids: e.target.value }))}
                        />
                        {errorSectionTest && <div className="text-red-500 text-sm">{errorSectionTest}</div>}
                        <DialogFooter>
                          <Button type="submit" disabled={creatingSectionTest}>
                            {creatingSectionTest ? 'Создание...' : 'Создать'}
                          </Button>
                          <DialogClose asChild>
                            <Button type="button" variant="outline">Отмена</Button>
                          </DialogClose>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
              {/* Подсекции */}
              {subsectionsMap[section.id] && subsectionsMap[section.id].length > 0 && (
                <div className="mt-4">
                  <div className="font-semibold mb-2">Подсекции:</div>
                  <ul className="list-disc pl-6">
                    {subsectionsMap[section.id].map((sub) => (
                      <li key={sub.id} className="flex items-center gap-2">
                        {sub.title}
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
              {section.tests && section.tests.length > 0 && (
                <div className="mt-4">
                  <div className="font-semibold mb-2">Тесты секции:</div>
                  <ul className="list-disc pl-6">
                    {section.tests.map((test) => (
                      <li key={test.id} className="flex items-center gap-2">
                        {test.title}
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
            </AccordionContent>
          </AccordionItem>
        ))}
        {tests.length > 0 && (
          <>
            <div className="mt-6 mb-2 font-semibold text-slate-700">
              Тесты по теме
            </div>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Тесты</h2>
              <div className="space-y-4">
                {tests.map(test => (
                  <div key={test.id} className="p-4 border rounded flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg">{test.title}</div>
                      <div className="text-muted-foreground text-sm">Тип: {test.type}</div>
                    </div>
                    {(user?.role === 'admin' || user?.role === 'teacher') && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setOpenQuestionsEditor(test.id)}>
                          Редактировать вопросы
                        </Button>
                        {editMode && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="text-destructive" title="Удалить тест">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить тест?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие необратимо. Тест и все его вопросы будут удалены.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={async () => {
                                  await testApi.deleteTest(test.id);
                                  setTests(prev => prev.filter(t => t.id !== test.id));
                                }}>Удалить</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </Accordion>
      {/* Модалка редактора вопросов */}
      <Modal open={!!openQuestionsEditor} onOpenChange={v => { if (!v) setOpenQuestionsEditor(null); }}>
        <ModalContent className="max-w-2xl w-full">
          <ModalHeader>
            <ModalTitle>Редактор вопросов теста</ModalTitle>
          </ModalHeader>
          {openQuestionsEditor && (
            <div className="py-4">
              <QuestionEditor testId={openQuestionsEditor} />
            </div>
          )}
          <DialogFooter className="flex justify-end">
            <ModalClose asChild>
              <Button variant="outline">Закрыть</Button>
            </ModalClose>
          </DialogFooter>
        </ModalContent>
      </Modal>
      {(user?.role === 'admin' || user?.id === topic.creator_id) && editMode && (
        <div className="flex justify-center mt-12">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="lg" variant="destructive" className="gap-2">
                <Trash2 className="h-5 w-5" />
                Удалить тему
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Вы уверены, что хотите удалить тему?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие необратимо. Будут удалены все секции, подсекции и тесты этой темы.<br/>
                  Для подтверждения введите <b>УДАЛИТЬ</b> в поле ниже:
                </AlertDialogDescription>
              </AlertDialogHeader>
              <input
                className="w-full border rounded px-3 py-2 my-2 text-center text-lg tracking-widest"
                placeholder="УДАЛИТЬ"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                autoFocus
              />
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteLoading}>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteInput !== 'УДАЛИТЬ' || deleteLoading}
                  onClick={async () => {
                    setDeleteLoading(true);
                    await topicApi.deleteTopicPermanently(topic.id);
                    window.location.href = '/topics';
                  }}
                >
                  {deleteLoading ? 'Удаление...' : 'Удалить'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </Layout>
  );
};

export default TopicPage;