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
import { Topic, topicApi } from "@/services/topicApi";
import { Section, sectionApi, Subsection } from "@/services/sectionApi";
import { Test, testApi } from "@/services/testApi";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateSubsectionDialog from "@/components/admin/CreateSubsectionDialog";
import { PlusCircleIcon, PencilIcon, XCircleIcon } from 'lucide-react';

type TopicContent = (Section | Test) & { itemType: 'section' | 'test' };

const TopicPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const { user } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  // Unified content state
  const [topicContent, setTopicContent] = useState<TopicContent[]>([]);

  // State for subsections, keyed by section ID
  const [subsectionsMap, setSubsectionsMap] = useState<Record<number, Subsection[]>>({});

  // Modal and form states
  const [openSectionDialog, setOpenSectionDialog] = useState(false);
  const [openTestDialog, setOpenTestDialog] = useState(false);
  
  const [sectionForm, setSectionForm] = useState({ title: '', description: '', content: '' });
  const [testForm, setTestForm] = useState({ title: '', type: 'GLOBAL_FINAL', duration: '' });
  
  const [isSubmittingSection, setIsSubmittingSection] = useState(false);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);
  const [errorSection, setErrorSection] = useState<string | null>(null);
  const [errorTest, setErrorTest] = useState<string | null>(null);

  // Subsection dialog state
  const [openSubsectionDialog, setOpenSubsectionDialog] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<number | null>(null);

  const fetchTopicData = async () => {
    if (!topicId) return;
    setLoading(true);
    try {
      const topicData = await topicApi.getTopic(Number(topicId));
        setTopic(topicData);

      const sectionsData = await sectionApi.getSectionsByTopic(Number(topicId));
      const testsData = await testApi.getTestsByTopic(Number(topicId));
      
      const combinedContent: TopicContent[] = [
        ...sectionsData.map(s => ({ ...s, itemType: 'section' as const })),
        ...testsData.map(t => ({ ...t, order: t.order ?? 999, itemType: 'test' as const })),
      ];

      combinedContent.sort((a, b) => a.order - b.order);
      setTopicContent(combinedContent);

      // Fetch subsections for each section
        const subsMap: Record<number, Subsection[]> = {};
        await Promise.all(
          sectionsData.map(async (section) => {
            try {
              const res = await sectionApi.getSectionSubsections(section.id);
            subsMap[section.id] = (res.subsections || []).sort((a,b) => a.order - b.order);
            } catch (error) {
            console.error(`Failed to load subsections for section ${section.id}:`, error);
              subsMap[section.id] = [];
            }
        })
        );
        setSubsectionsMap(subsMap);

    } catch (error) {
      console.error("Error loading topic data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopicData();
  }, [topicId]);

  const handleOpenSubsectionDialog = (sectionId: number) => {
    setCurrentSectionId(sectionId);
    setOpenSubsectionDialog(true);
  };

  const handleSubsectionCreated = async () => {
    if (!currentSectionId) return;
    
    // Refetch subsections for the specific section and update the map
    const res = await sectionApi.getSectionSubsections(currentSectionId);
    const sortedSubsections = (res.subsections || []).sort((a,b) => a.order - b.order);
    
    setSubsectionsMap(prev => ({
      ...prev,
      [currentSectionId]: sortedSubsections,
    }));
    
    // Close dialog and reset section ID
    setOpenSubsectionDialog(false);
    setCurrentSectionId(null);
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId) return;

    setIsSubmittingSection(true);
    setErrorSection(null);
    try {
      await sectionApi.createSection({
        ...sectionForm,
        topic_id: Number(topicId),
        order: topicContent.length + 1,
      });
      setSectionForm({ title: '', description: '', content: '' });
      setOpenSectionDialog(false);
      await fetchTopicData();
    } catch (err) {
      console.error("Failed to create section:", err);
      setErrorSection('Ошибка при создании секции. Попробуйте снова.');
    } finally {
      setIsSubmittingSection(false);
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId) return;

    setIsSubmittingTest(true);
    setErrorTest(null);
    try {
      await testApi.createTest({
        title: testForm.title,
        type: 'GLOBAL_FINAL',
        duration: testForm.duration ? Number(testForm.duration) : undefined,
        topic_id: Number(topicId),
        order: topicContent.length + 1,
      });
      setTestForm({ title: '', type: 'GLOBAL_FINAL', duration: '' });
      setOpenTestDialog(false);
      await fetchTopicData();
    } catch (err) {
      console.error("Failed to create test:", err);
      setErrorTest('Ошибка при создании теста. Попробуйте снова.');
    } finally {
      setIsSubmittingTest(false);
    }
  };

  if (loading) {
    return <Layout><div className="text-center py-10">Загрузка...</div></Layout>;
  }
  if (!topic) {
    return <Layout><div className="text-center py-10">Тема не найдена</div></Layout>;
  }

  const isTeacherOrAdmin = user?.role === 'admin' || user?.role === 'teacher';

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center relative">
          <h1 className="text-4xl font-bold">{topic.title}</h1>
          {topic.description && <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{topic.description}</p>}
          {isTeacherOrAdmin && (
            <div className="absolute top-0 right-0">
              <Button onClick={() => setIsEditMode(!isEditMode)} variant="outline" size="icon">
                {isEditMode ? <XCircleIcon className="h-5 w-5" /> : <PencilIcon className="h-5 w-5" />}
                <span className="sr-only">{isEditMode ? 'Завершить редактирование' : 'Редактировать'}</span>
              </Button>
            </div>
          )}
        </div>

        {topicContent.length === 0 && !loading && !isEditMode && (
          <div className="text-center text-muted-foreground py-10">
            <p>В этой теме пока нет материалов.</p>
            {isTeacherOrAdmin && <p>Нажмите кнопку "Редактировать", чтобы добавить секцию или итоговый тест.</p>}
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <Accordion type="multiple" className="w-full space-y-4">
            {topicContent.map((item) => {
              if (item.itemType === 'section') {
                const section = item as Section;
                const sectionSubsections = subsectionsMap[section.id] || [];
                return (
                  <AccordionItem value={`section-${section.id}`} key={`item-section-${section.id}`} className="border rounded-lg bg-white shadow-sm">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold">{section.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 py-4 border-t">
                      <p className="text-muted-foreground mb-4">{section.description}</p>
                      <div className="space-y-2">
                        {sectionSubsections.map(sub => (
                           <div key={sub.id} className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 transition-colors">
                             <Link to={sub.file_path ? `http://localhost:8000${sub.file_path.replace(/\\/g, '/').replace('Backend', '')}`: `/subsection/${sub.id}`} target={sub.file_path ? "_blank" : "_self"} className="text-blue-600 hover:underline flex-grow">{sub.title}</Link>
                           </div>
                        ))}
                      </div>
                       {isEditMode && (
                         <div className="mt-4 pt-4 border-t">
                           <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => handleOpenSubsectionDialog(section.id)}>
                             <PlusCircleIcon className="h-4 w-4" />
                             Добавить подсекцию
                           </Button>
                         </div>
                       )}
                    </AccordionContent>
                  </AccordionItem>
                );
              } else if (item.itemType === 'test') {
                const test = item as Test;
                return (
                  <div key={`item-test-${test.id}`} className="border rounded-lg bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                    <span className="text-lg font-semibold">{test.title}</span>
                    <Button asChild>
                      <Link to={`/test/${test.id}`}>Начать тест</Link>
                    </Button>
                  </div>
                );
              }
              return null;
            })}
          </Accordion>

          {isEditMode && (
            <div className="mt-4">
              <Dialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full py-6 border-dashed hover:border-solid">
                      <PlusCircleIcon className="h-5 w-5 mr-2" />
                      Add Block
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem onSelect={() => setOpenSectionDialog(true)}>
                      Добавить секцию
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setOpenTestDialog(true)}>
                      Добавить итоговый тест
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Dialog>
            </div>
        )}
      </div>

        {/* Dialog for creating a new section */}
        <Dialog open={openSectionDialog} onOpenChange={setOpenSectionDialog}>
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
                {errorSection && <div className="text-red-500 text-sm">{errorSection}</div>}
                <DialogFooter>
                <Button type="submit" disabled={isSubmittingSection}>
                  {isSubmittingSection ? 'Создание...' : 'Создать'}
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Отмена</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

        <Dialog open={openTestDialog} onOpenChange={setOpenTestDialog}>
            <DialogContent>
              <DialogHeader>
              <DialogTitle>Создать итоговый тест</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTest} className="space-y-4">
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Название теста"
                  value={testForm.title}
                  onChange={e => setTestForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
                <input
                  className="w-full border rounded px-3 py-2"
                placeholder="Продолжительность (в минутах)"
                  type="number"
                  value={testForm.duration}
                  onChange={e => setTestForm(f => ({ ...f, duration: e.target.value }))}
                />
                {errorTest && <div className="text-red-500 text-sm">{errorTest}</div>}
                <DialogFooter>
                <Button type="submit" disabled={isSubmittingTest}>
                  {isSubmittingTest ? 'Создание...' : 'Создать'}
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Отмена</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
    </Layout>
  );
};

export default TopicPage;