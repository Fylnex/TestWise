import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, ChevronDown, ChevronRight, Menu, ChevronLeft } from 'lucide-react';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import { sectionApi } from '@/services/sectionApi';
import { topicApi } from '@/services/topicApi';
import { testApi } from '@/services/testApi';

function TreeItem({ item, level = 0, onSelect = undefined, onAdd, onDelete, onAddSubsection, onDeleteSubsection, navigate }) {
  const [open, setOpen] = useState(true);

  const hasChildren = (item.subsections && item.subsections.length > 0) || (item.tests && item.tests.length > 0);

  const handleItemClick = (e) => {
    e.stopPropagation();
    if (item.type === 'section') navigate(`/section/tree/${item.id}`);
    else if (item.type === 'subsection') navigate(`/subsection/${item.id}`);
    else if (item.type === 'test') navigate(`/test/${item.id}`);
  };

  return (
    <li>
      <div
        className={"flex items-center group cursor-pointer px-2 py-1 rounded transition hover:bg-gray-100"}
        style={{ paddingLeft: 12 + level * 16 }}
      >
        {hasChildren && (
          <span className="mr-1" onClick={e => { e.stopPropagation(); setOpen(o => !o); }}>
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
        <span className="flex-1 truncate select-none" onClick={handleItemClick}>{item.title}</span>
      </div>
      {hasChildren && open && (
        <ul>
          {item.subsections?.map(sub =>
            <TreeItem key={sub.id} item={{ ...sub, key: `subsection-${sub.id}`, type: 'subsection' }} level={level + 1} onSelect={onSelect} onAdd={onAdd} onDelete={onDelete} onAddSubsection={onAddSubsection} onDeleteSubsection={onDeleteSubsection} navigate={navigate} />
          )}
          {item.tests?.map(test =>
            <TreeItem key={test.id} item={{ ...test, key: `test-${test.id}`, type: 'test' }} level={level + 1} onSelect={onSelect} onAdd={onAdd} onDelete={onDelete} onAddSubsection={onAddSubsection} onDeleteSubsection={onDeleteSubsection} navigate={navigate} />
          )}
        </ul>
      )}
    </li>
  );
}

export default function TopicSectionTree() {
  const { sectionId } = useParams();
  const navigate = useNavigate();

  // --- Хлебные крошки ---
  const [topicTitle, setTopicTitle] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState<string | null>(null);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [loadingCrumbs, setLoadingCrumbs] = useState(false);

  // --- Данные для дерева ---
  const [sections, setSections] = useState<any[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    topicApi.getSectionsByTopic(topicId)
      .then(async (sections) => {
        const tests = await testApi.getTestsByTopic(topicId);
        // Для каждой секции получаем подсекции и тесты
        const sectionsWithSubs = await Promise.all(
          sections.map(async (section) => {
            const sectionWithSubs = await sectionApi.getSectionSubsections(section.id);
            const sectionTests = tests.filter(t => t.section_id === section.id);
            return { ...section, subsections: sectionWithSubs.subsections, tests: sectionTests };
          })
        );
        setSections(sectionsWithSubs);
      })
      .finally(() => setLoadingTree(false));
  }, [topicId]);

  // Логика добавления/удаления (заглушка)
  const handleAdd = (item) => {
    alert(`Добавить в ${item?.title || 'тему'}`);
  };
  const handleDelete = (item) => {
    if (window.confirm(`Удалить ${item.title}?`)) {
      alert('Удалено (заглушка)');
    }
  };

  // Добавление подсекции
  const handleAddSubsection = async (section, title) => {
    // Для TEXT отправляем JSON на /subsections/json
    const jsonData = {
      section_id: section.id,
      title,
      type: 'text' as const,
      order: (section.subsections?.length || 0) + 1,
      content: '',
    };
    await sectionApi.createSubsectionJson(jsonData);
    // Обновить дерево
    if (topicId) {
      setLoadingTree(true);
      topicApi.getSectionsByTopic(topicId)
        .then(async (sections) => {
          const tests = await testApi.getTestsByTopic(topicId);
          const sectionsWithSubs = await Promise.all(
            sections.map(async (section) => {
              const sectionWithSubs = await sectionApi.getSectionSubsections(section.id);
              const sectionTests = tests.filter(t => t.section_id === section.id);
              return { ...section, subsections: sectionWithSubs.subsections, tests: sectionTests };
            })
          );
          setSections(sectionsWithSubs);
        })
        .finally(() => setLoadingTree(false));
    }
  };

  // Удаление подсекции
  const handleDeleteSubsection = async (subsection) => {
    if (!window.confirm(`Удалить подсекцию "${subsection.title}"?`)) return;
    await sectionApi.deleteSubsection(subsection.id);
    // Обновить дерево
    if (topicId) {
      setLoadingTree(true);
      topicApi.getSectionsByTopic(topicId)
        .then(async (sections) => {
          const tests = await testApi.getTestsByTopic(topicId);
          const sectionsWithSubs = await Promise.all(
            sections.map(async (section) => {
              const sectionWithSubs = await sectionApi.getSectionSubsections(section.id);
              const sectionTests = tests.filter(t => t.section_id === section.id);
              return { ...section, subsections: sectionWithSubs.subsections, tests: sectionTests };
            })
          );
          setSections(sectionsWithSubs);
        })
        .finally(() => setLoadingTree(false));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 min-h-0">
        {sidebarOpen && (
          <aside className="w-80 bg-[#F5F7FA] border-r border-[#E0E4EA] p-4 overflow-y-auto transition-all duration-300 h-full min-h-screen flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Структура темы</h2>
            </div>
            {loadingTree ? (
              <div className="text-gray-400 text-center py-10">Загрузка...</div>
            ) : sections.length === 0 ? (
              <div className="text-gray-400 text-center py-10">Нет секций</div>
            ) : (
              <ul>
                {sections.map(section =>
                  <TreeItem
                    key={section.id}
                    item={{ ...section, key: `section-${section.id}`, type: 'section' }}
                    onAdd={handleAdd}
                    onDelete={handleDelete}
                    onAddSubsection={handleAddSubsection}
                    onDeleteSubsection={handleDeleteSubsection}
                    navigate={navigate}
                  />
                )}
              </ul>
            )}
          </aside>
        )}
        <main className="flex-1 p-8 flex flex-col items-center justify-center relative">
          {/* Кнопка скрытия/открытия меню — внутри main, как на Solvit */}
          <button
            className="absolute left-0 top-0 mt-2 ml-2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-white/80 border border-[#E0E4EA] shadow-lg hover:bg-white transition backdrop-blur-sm"
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? 'Скрыть меню' : 'Показать меню'}
            style={{ boxShadow: '0 4px 24px 0 rgba(60, 80, 120, 0.10)' }}
          >
            {sidebarOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
          </button>
          {/* Хлебные крошки теперь только здесь */}
          <div className="w-full flex items-center justify-center mb-6">
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
          {sections.length === 0 ? (
            <div className="flex flex-col items-center">
              <svg width="80" height="80" fill="none" className="mb-6 text-gray-300" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="4" />
                <path d="M25 40h30M40 25v30" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              <h1 className="text-2xl font-bold mb-2 text-gray-700">Нет секций</h1>
              <p className="text-gray-500 mb-4">Добавьте первую секцию, чтобы начать наполнять тему содержимым.</p>
              <Button variant="outline" onClick={() => handleAdd({ title: 'Новая секция' })}>
                <PlusCircle className="mr-2 h-5 w-5" /> Добавить секцию
              </Button>
            </div>
          ) : (
            <Card className="p-8 min-h-[300px] w-full max-w-3xl mx-auto">
              <h1 className="text-2xl font-bold mb-4">Все секции и подсекции</h1>
              <div className="text-gray-600">Здесь будет отображаться содержимое всех секций, подсекций и тестов.</div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
} 