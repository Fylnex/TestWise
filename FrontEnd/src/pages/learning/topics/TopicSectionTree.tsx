import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams, Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, ChevronDown, ChevronRight, Menu, ChevronLeft, FileText, Folder, FilePlus2, FileCheck2, BookOpen } from 'lucide-react';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import { sectionApi } from '@/services/sectionApi';
import { topicApi } from '@/services/topicApi';
import { testApi } from '@/services/testApi';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { progressApi, TestAttempt } from '@/services/progressApi';
import { useAuth } from '@/context/AuthContext';

function TreeItem({ item, level = 0, navigate, setSelectedSection, setSelectedSub, setShowTopicStructure, testAttempts = [], topicId }) {
  const [open, setOpen] = useState(true);
  const hasChildren = (item.subsections && item.subsections.length > 0) || (item.tests && item.tests.length > 0);

  // Функция для определения состояния теста
  const getTestStatus = (testId: number) => {
    const attempts = testAttempts.filter(attempt => attempt.test_id === testId);
    if (attempts.length === 0) return 'not-started';
    
    const completedAttempts = attempts.filter(attempt => attempt.completed_at);
    if (completedAttempts.length === 0) return 'in-progress';
    
    const bestScore = Math.max(...completedAttempts.map(attempt => attempt.score || 0));
    if (bestScore >= 80) return 'excellent';
    if (bestScore >= 60) return 'passed';
    return 'failed';
  };

  // Функция для получения иконки состояния теста
  const getTestStatusIcon = (testId: number) => {
    const status = getTestStatus(testId);
    switch (status) {
      case 'excellent':
        return <div className="w-3 h-3 rounded-full bg-green-500 mr-1" title="Отлично (80%+)"></div>;
      case 'passed':
        return <div className="w-3 h-3 rounded-full bg-blue-500 mr-1" title="Сдан (60%+)"></div>;
      case 'failed':
        return <div className="w-3 h-3 rounded-full bg-red-500 mr-1" title="Не сдан (<60%)"></div>;
      case 'in-progress':
        return <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1" title="В процессе"></div>;
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-300 mr-1" title="Не начат"></div>;
    }
  };

  // Определяем иконку
  let icon = null;
  if (item.type === 'section') icon = <Folder className="mr-1 text-blue-500" size={18} />;
  else if (item.type === 'topic-section') icon = <BookOpen className="mr-1 text-orange-500" size={18} />;
  else if (item.type === 'final-section') icon = <Folder className="mr-1 text-purple-500" size={18} />;
  else if (item.type === 'subsection') icon = <FileText className="mr-1 text-gray-400" size={16} />;
  else if (item.type === 'test') {
    const statusIcon = getTestStatusIcon(item.id);
    icon = (
      <div className="flex items-center">
        {statusIcon}
        <FileCheck2 className="text-green-500" size={16} />
      </div>
    );
  }

  // Увеличиваем отступы для подразделов и тестов
  let paddingLeft = 12;
  if (item.type === 'subsection') paddingLeft = 40;
  if (item.type === 'test') paddingLeft = 60;

  return (
    <li>
      <div
        className={"flex items-center cursor-pointer px-2 py-1 rounded transition hover:bg-gray-100"}
        style={{ paddingLeft }}
        onClick={e => {
          e.stopPropagation();
          if (item.type === 'section' || item.type === 'topic-section' || item.type === 'final-section') {
            setSelectedSection(item);
            setSelectedSub(null);
            setShowTopicStructure(false);
            if (item.type === 'final-section' || item.type === 'topic-section') {
              // Для виртуальных секций не меняем URL
            } else {
              navigate(`/section/tree/${item.id}`);
            }
          } else if (item.type === 'subsection') {
            setSelectedSub(item);
            setSelectedSection(null);
            setShowTopicStructure(false);
            navigate(`/section/tree/${item.section_id}?sub=${item.id}`);
          } else if (item.type === 'test') {
            // Для тестов переходим к тесту с правильными параметрами
            if (item.section_id) {
              // Тест принадлежит секции
              navigate(`/topic/${topicId}/section/${item.section_id}/test/${item.id}`);
            } else {
              // Тест принадлежит теме (не секции)
              navigate(`/topic/${topicId}/test/${item.id}`);
            }
          }
        }}
      >
        {hasChildren && (
          <span className="mr-1" onClick={e => { e.stopPropagation(); setOpen(o => !o); }}>
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
        {icon}
        <span className="flex-1 truncate select-none">{item.title}</span>
      </div>
      {hasChildren && open && (
        <ul>
          {item.subsections?.map(sub =>
            <TreeItem key={sub.id} item={{ ...sub, key: `subsection-${sub.id}`, type: 'subsection' }} level={level + 1} navigate={navigate} setSelectedSection={setSelectedSection} setSelectedSub={setSelectedSub} setShowTopicStructure={setShowTopicStructure} testAttempts={testAttempts} topicId={topicId} />
          )}
          {item.tests?.map(test =>
            <TreeItem key={test.id} item={{ ...test, key: `test-${test.id}`, type: 'test' }} level={level + 2} navigate={navigate} setSelectedSection={setSelectedSection} setSelectedSub={setSelectedSub} setShowTopicStructure={setShowTopicStructure} testAttempts={testAttempts} topicId={topicId} />
          )}
        </ul>
      )}
    </li>
  );
}

export default function TopicSectionTree() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subId = searchParams.get('sub');
  const { toast } = useToast();
  const { user } = useAuth();

  // Если sectionId отсутствует, редирект на 404
  if (!sectionId) return <Navigate to="/404" />;

  // --- Хлебные крошки ---
  const [topicTitle, setTopicTitle] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState<string | null>(null);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [loadingCrumbs, setLoadingCrumbs] = useState(false);

  // --- Данные для дерева ---
  const [sections, setSections] = useState<any[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);

  // --- Данные для выбранного подраздела ---
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [loadingSub, setLoadingSub] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [selectedSection, setSelectedSection] = useState<any | null>(null);

  const [showTopicStructure, setShowTopicStructure] = useState(false);

  // Состояние для попыток тестов
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  useEffect(() => {
    if (!sectionId) return;
    setLoadingCrumbs(true);
    sectionApi.getSection(Number(sectionId))
      .then(section => {
        setSectionTitle(section.title);
        setTopicId(section.topic_id);
        return topicApi.getTopic(section.topic_id);
      })
      .then(topic => {
        setTopicTitle(topic.title);
      })
      .finally(() => setLoadingCrumbs(false));
  }, [sectionId]);

  useEffect(() => {
    if (!topicId) return;
    setLoadingTree(true);
    Promise.all([
      topicApi.getSectionsByTopic(topicId),
      testApi.getTestsByTopic(topicId)
    ]).then(async ([sections, tests]) => {
      // Для каждой секции получаем подсекции и тесты через отдельные запросы
      const sectionsWithSubs = await Promise.all(
        sections.map(async (section) => {
          const sectionWithSubs = await sectionApi.getSectionSubsections(section.id);
          const sectionTests = await testApi.getTestsBySection(section.id);
          return { ...section, subsections: sectionWithSubs.subsections, tests: sectionTests };
        })
      );
      
      // Получаем тесты по теме (не привязанные к секциям)
      const topicTests = tests.filter(t => !t.section_id && t.type !== 'final');
      
      // Получаем итоговые тесты по теме
      const finalTests = tests.filter(t => t.type === 'final');
      
      // Создаем массив секций с добавлением тестов по теме и итоговых тестов
      let allSections = [...sectionsWithSubs];
      
      // Добавляем тесты по теме, если они есть
      if (topicTests.length > 0) {
        allSections.push({ 
          id: -1, // Виртуальный ID для тестов по теме
          title: 'Тесты по теме', 
          type: 'topic-section',
          tests: topicTests,
          subsections: [],
          topic_id: topicId,
          content: '',
          description: '',
          order: 999,
          created_at: new Date().toISOString(),
          is_archived: false
        } as any);
      }
      
      // Добавляем итоговые тесты, если они есть
      if (finalTests.length > 0) {
        allSections.push({ 
          id: -2, // Виртуальный ID для итоговых тестов
          title: 'Итоговые тесты', 
          type: 'final-section',
          tests: finalTests,
          subsections: [],
          topic_id: topicId,
          content: '',
          description: '',
          order: 1000,
          created_at: new Date().toISOString(),
          is_archived: false
        } as any);
      }
      
      setSections(allSections);
    })
    .finally(() => setLoadingTree(false));
  }, [topicId]);

  // Получить контент подраздела, если subId задан
  useEffect(() => {
    if (!subId || !sectionId) {
      setSelectedSub(null);
      return;
    }
    setLoadingSub(true);
    sectionApi.getSectionSubsections(Number(sectionId))
      .then((data) => {
        const found = data.subsections?.find((s: any) => String(s.id) === String(subId));
        setSelectedSub(found || null);
      })
      .finally(() => setLoadingSub(false));
  }, [subId, sectionId]);

  // Загрузить попытки тестов для текущего пользователя
  useEffect(() => {
    if (!user?.id) return;
    setLoadingAttempts(true);
    progressApi.getTestAttempts(user.id)
      .then(setTestAttempts)
      .catch(console.error)
      .finally(() => setLoadingAttempts(false));
  }, [user?.id]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <aside className="w-80 bg-[#F5F7FA] border-r border-[#E0E4EA] p-4 overflow-y-auto transition-all duration-300 flex-shrink-0 z-10 relative" style={{ height: 'calc(100vh - 80px)' }}>
            <div className="flex items-center justify-between mb-4">
              {topicTitle ? (
                <button
                  className="text-lg font-bold text-blue-700 focus:outline-none text-left"
                  onClick={() => {
                    setShowTopicStructure(true);
                    setSelectedSection(null);
                    setSelectedSub(null);
                  }}
                  title="Показать структуру всей темы"
                  style={{ flex: 1 }}
                >
                  {topicTitle}
                </button>
              ) : (
                <span className="text-lg font-bold text-gray-400">Тема</span>
              )}
              {/* Кнопка скрытия сайдбара внутри aside */}
              <button
                className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 border border-[#E0E4EA] shadow hover:bg-white transition"
                onClick={() => setSidebarOpen(false)}
                title="Скрыть меню"
                type="button"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
            {loadingTree ? (
              <div className="text-gray-400 text-center py-10">Загрузка...</div>
            ) : sections.length === 0 && !subId ? (
              <div className="flex flex-col items-center">
                <svg width="80" height="80" fill="none" className="mb-6 text-gray-300" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="4" />
                  <path d="M25 40h30M40 25v30" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                </svg>
                <h1 className="text-2xl font-bold mb-2 text-gray-700">Нет секций</h1>
                <p className="text-gray-500 mb-4">Добавьте первую секцию, чтобы начать наполнять тему содержимым.</p>
              </div>
            ) : (
              <ul>
                {sections.map(section =>
                  <TreeItem
                    key={section.id}
                    item={{ ...section, key: `section-${section.id}`, type: 'section' }}
                    navigate={navigate}
                    setSelectedSection={setSelectedSection}
                    setSelectedSub={setSelectedSub}
                    setShowTopicStructure={setShowTopicStructure}
                    testAttempts={testAttempts}
                    topicId={topicId}
                  />
                )}
              </ul>
            )}
          </aside>
        )}
        {/* Кнопка открытия сайдбара, если он скрыт */}
        {!sidebarOpen && (
          <button
            className="fixed left-0 top-24 z-20 w-10 h-10 flex items-center justify-center rounded-r-full bg-white/80 border border-[#E0E4EA] shadow-lg hover:bg-white transition backdrop-blur-sm"
            onClick={() => setSidebarOpen(true)}
            title="Показать меню"
            style={{ boxShadow: '0 4px 24px 0 rgba(60, 80, 120, 0.10)' }}
            type="button"
          >
            <ChevronRight size={24} />
          </button>
        )}
        <main className="flex-1 overflow-y-auto p-8 flex flex-col items-center pt-6 relative" style={{ height: 'calc(100vh - 80px)' }}>
          {/* Хлебные крошки теперь внутри main, не влияют на sidebar */}
          <div className="w-full flex items-center justify-center mt-0 mb-4">
            <nav className="text-sm text-gray-500 flex items-center gap-2 justify-center">
              <Link to="/" className="hover:underline">Главная</Link>
              <span className="mx-1">/</span>
              <Link to="/topics" className="hover:underline">Темы</Link>
              <span className="mx-1">/</span>
              {loadingCrumbs ? (
                <span className="animate-pulse text-gray-300">Загрузка...</span>
              ) : topicTitle ? (
                <>
                  <Link to={topicId ? `/topic/${topicId}` : '#'} className="hover:underline">{topicTitle}</Link>
                  <span className="mx-1">/</span>
                  <span className="text-gray-700 font-medium">{sectionTitle || 'Вопрос'}</span>
                </>
              ) : (
                <span className="text-gray-300">Тема</span>
              )}
            </nav>
          </div>
          {showTopicStructure ? (
            <Card className="w-full max-w-2xl mx-auto mb-8 p-6 bg-white rounded-xl shadow border border-gray-200">
              <h2 className="text-xl font-bold mb-4 flex items-center text-blue-700">Структура темы: {topicTitle}</h2>
              <ul>
                {sections.map(section =>
                  <TreeItem
                    key={section.id}
                    item={{ ...section, key: `section-${section.id}`, type: 'section' }}
                    navigate={navigate}
                    setSelectedSection={setSelectedSection}
                    setSelectedSub={setSelectedSub}
                    setShowTopicStructure={setShowTopicStructure}
                    testAttempts={testAttempts}
                    topicId={topicId}
                  />
                )}
              </ul>
            </Card>
          ) : selectedSub ? (
            <Card className="w-full max-w-2xl mx-auto mb-8 p-6 bg-white rounded-xl shadow border border-gray-200">
              <h2 className="text-xl font-bold mb-2 flex items-center"><FileText className="mr-2 text-gray-400" />{selectedSub.title}</h2>
              {selectedSub.content && <div className="mb-4 text-gray-700 whitespace-pre-line">{selectedSub.content}</div>}
            </Card>
          ) : selectedSection ? (
            <Card className="w-full max-w-2xl mx-auto mb-8 p-6 bg-white rounded-xl shadow border border-gray-200">
              <h2 className="text-xl font-bold mb-2 flex items-center">
                {selectedSection.type === 'final-section' ? (
                  <Folder className="mr-2 text-purple-500" />
                ) : selectedSection.type === 'topic-section' ? (
                  <BookOpen className="mr-2 text-orange-500" />
                ) : (
                  <Folder className="mr-2 text-blue-500" />
                )}
                {selectedSection.title}
              </h2>
              {selectedSection.description && <div className="mb-4 text-gray-700 whitespace-pre-line">{selectedSection.description}</div>}
              {selectedSection.type === 'section' && (
                <>
                  <div className="mb-2 font-semibold">Подразделы:</div>
                  {selectedSection.subsections && selectedSection.subsections.length > 0 ? (
                    <ul className="mb-4">
                      {selectedSection.subsections.map((sub: any) => (
                        <li key={sub.id} className="flex items-center mb-1 pl-4"><FileText className="mr-2 text-gray-400" size={16} />{sub.title}</li>
                      ))}
                    </ul>
                  ) : <div className="mb-4 text-gray-400">Нет подразделов</div>}
                </>
              )}
              <div className="mb-2 font-semibold">
                {selectedSection.type === 'final-section' ? 'Итоговые тесты:' : 
                 selectedSection.type === 'topic-section' ? 'Тесты по теме:' : 'Тесты:'}
              </div>
              {selectedSection.tests && selectedSection.tests.length > 0 ? (
                <ul>
                  {selectedSection.tests.map((test: any) => {
                    const attempts = testAttempts.filter(attempt => attempt.test_id === test.id);
                    const completedAttempts = attempts.filter(attempt => attempt.completed_at);
                    const bestScore = completedAttempts.length > 0 ? Math.max(...completedAttempts.map(attempt => attempt.score || 0)) : null;
                    
                    let statusColor = 'text-gray-400';
                    let statusText = 'Не начат';
                    
                    if (attempts.length > 0 && completedAttempts.length === 0) {
                      statusColor = 'text-yellow-500';
                      statusText = 'В процессе';
                    } else if (bestScore !== null) {
                      if (bestScore >= 80) {
                        statusColor = 'text-green-500';
                        statusText = `Отлично (${bestScore}%)`;
                      } else if (bestScore >= 60) {
                        statusColor = 'text-blue-500';
                        statusText = `Сдан (${bestScore}%)`;
                      } else {
                        statusColor = 'text-red-500';
                        statusText = `Не сдан (${bestScore}%)`;
                      }
                    }
                    
                    return (
                      <li key={test.id} className="flex items-center mb-1 pl-4">
                        <FileCheck2 className="mr-2 text-green-500" size={16} />
                        <span 
                          className="cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => {
                            if (test.section_id) {
                              navigate(`/topic/${topicId}/section/${test.section_id}/test/${test.id}`);
                            } else {
                              navigate(`/topic/${topicId}/test/${test.id}`);
                            }
                          }}
                        >
                          {test.title}
                        </span>
                        <span className={`ml-2 text-xs ${statusColor}`}>
                          {statusText}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : <div className="text-gray-400">Нет тестов</div>}
            </Card>
          ) : (
            <div className="w-full max-w-2xl mx-auto mb-8 p-6 bg-white rounded-xl shadow border border-gray-200 text-center text-gray-400">
              Выберите раздел или подраздел в дереве слева, чтобы посмотреть подробную информацию
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 