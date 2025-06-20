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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateSubsectionDialog from "@/components/admin/CreateSubsectionDialog";

type TopicContent = (Section | Test) & { itemType: 'section' | 'test' };

const TopicPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const { user } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!topicId) return;

    const fetchTopicData = async () => {
      setLoading(true);
      try {
        const topicData = await topicApi.getTopic(Number(topicId));
        setTopic(topicData);

        const sectionsData = await topicApi.getSectionsByTopic(Number(topicId));
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
    setIsSubmittingSection(true);
    setErrorSection(null);
    try {
      const newSection = await topicApi.createSection({
        ...sectionForm,
        topic_id: Number(topicId),
        order: topicContent.length, // Assign order at the end
      });
      setTopicContent(prev => [...prev, { ...newSection, itemType: 'section' as const }].sort((a, b) => a.order - b.order));
      setSectionForm({ title: '', description: '', content: '' });
      setOpenSectionDialog(false);
    } catch (err) {
      setErrorSection('Ошибка при создании секции');
    } finally {
      setIsSubmittingSection(false);
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTest(true);
    setErrorTest(null);
    try {
      const newTest = await testApi.createTest({
        title: testForm.title,
        type: 'GLOBAL_FINAL',
        duration: testForm.duration ? Number(testForm.duration) : undefined,
        topic_id: Number(topicId),
        order: topicContent.length, // Assign order at the end
      });
      // Assuming 'order' is part of the response object, even if not in the type
      const newTestTyped = { ...newTest, order: newTest.order ?? topicContent.length, itemType: 'test' as const};
      setTopicContent(prev => [...prev, newTestTyped].sort((a,b) => a.order - b.order));
      setTestForm({ title: '', type: 'GLOBAL_FINAL', duration: '' });
      setOpenTestDialog(false);
    } catch (err) {
      setErrorTest('Ошибка при создании теста');
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
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold">{topic.title}</h1>
          {topic.description && <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{topic.description}</p>}
        </div>

        {isTeacherOrAdmin && (
          <div className="flex justify-center mb-8">
            <Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>Add Block</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
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

        {topicContent.length === 0 && !loading && (
          <div className="text-center text-muted-foreground py-10">
            <p>В этой теме пока нет материалов.</p>
            <p>Нажмите "Add Block", чтобы добавить секцию или итоговый тест.</p>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <Accordion type="multiple" className="w-full space-y-4">
            {topicContent.map((item) => {
              if (item.itemType === 'section') {
                const section = item as Section;
                const sectionSubsections = subsectionsMap[section.id] || [];
                return (
                  <AccordionItem value={`section-${section.id}`} key={`section-${section.id}`} className="border rounded-lg">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold">{section.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 py-4 border-t">
                      <p className="text-muted-foreground mb-4">{section.description}</p>
                      <div className="space-y-2">
                        {sectionSubsections.map(sub => (
                           <div key={sub.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100">
                             <Link to={sub.file_path ? `http://localhost:8000${sub.file_path.replace(/\\/g, '/').replace('Backend', '')}`: `/subsection/${sub.id}`} target={sub.file_path ? "_blank" : "_self"} className="text-blue-600 hover:underline">{sub.title}</Link>
                           </div>
                        ))}
                      </div>
                       {isTeacherOrAdmin && (
                         <div className="mt-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">Add Block</Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => handleOpenSubsectionDialog(section.id)}>
                                  Добавить подсекцию
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => alert(`Создание теста для секции ${section.id}`)}>
                                  Добавить тест
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                         </div>
                       )}
                    </AccordionContent>
                  </AccordionItem>
                );
              } else {
                const test = item as Test;
                return (
                  <div key={`test-${test.id}`} className="border rounded-lg px-6 py-4 flex justify-between items-center">
                    <span className="text-lg font-semibold">{test.title}</span>
                    <Link to={`/test/${test.id}`}>
                      <Button variant="secondary">Начать тест</Button>
                    </Link>
                  </div>
                );
              }
            })}
          </Accordion>
        </div>

        {/* --- Dialogs for creating content --- */}
        {currentSectionId && (
          <CreateSubsectionDialog
            open={openSubsectionDialog}
            onOpenChange={setOpenSubsectionDialog}
            sectionId={currentSectionId}
            onSubsectionCreated={handleSubsectionCreated}
          />
        )}
        
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