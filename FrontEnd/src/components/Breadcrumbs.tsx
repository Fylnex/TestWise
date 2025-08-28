import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { topicApi } from '@/services/topicApi';
import { groupApi } from '@/services/groupApi';
import { testApi } from '@/services/testApi';
import { Home } from 'lucide-react';

// A map for static routes
const breadcrumbNameMap: { [key: string]: string } = {
  '/': 'Главная',
  '/topics': 'Темы',
  '/topics/create': 'Создание темы',

  '/profile': 'Профиль',
  '/admin': 'Админ-панель',
  '/teacher': 'Панель преподавателя',
  '/settings': 'Настройки',
  '/privacy': 'Политика конфиденциальности',
  '/terms': 'Условия использования',
  '/contact': 'Контакты',
};

const Breadcrumbs = () => {
  const location = useLocation();
  const [dynamicNames, setDynamicNames] = useState<{ [key: string]: string }>({});

  const pathnames = location.pathname.split('/').filter((x) => x);

  useEffect(() => {
    const fetchDynamicNames = async () => {
      const newDynamicNames: { [key: string]: string } = {};
      for (let i = 0; i < pathnames.length; i++) {
        const currentPath = `/${pathnames.slice(0, i + 1).join('/')}`;
        if (dynamicNames[currentPath]) continue;

        const prevSegment = pathnames[i - 1];
        const currentSegment = pathnames[i];

        try {
          if (prevSegment === 'topic' && !isNaN(Number(currentSegment))) {
            const topic = await topicApi.getTopic(Number(currentSegment));
            newDynamicNames[currentPath] = topic.title;
          } else if (prevSegment === 'teacher' && pathnames[i] === 'group' && !isNaN(Number(pathnames[i+1]))) {
            const groupPath = `/${pathnames.slice(0, i + 2).join('/')}`;
            const group = await groupApi.getGroup(Number(pathnames[i+1]));
            newDynamicNames[groupPath] = group.name;
          } else if (prevSegment === 'test' && !isNaN(Number(currentSegment)) && pathnames[i+1] === 'questions') {
            // Обработка пути /test/:testId/questions
            const test = await testApi.getTest(Number(currentSegment));
            newDynamicNames[currentPath] = test.title;
            
            // Если тест связан с темой, получаем название темы
            if (test.topic_id) {
              const topicPath = `/topic/${test.topic_id}`;
              const topic = await topicApi.getTopic(test.topic_id);
              newDynamicNames[topicPath] = topic.title;
            }
            

          }
        } catch (error) {
          console.error("Failed to fetch dynamic breadcrumb name:", error);
          newDynamicNames[currentPath] = currentSegment; // Fallback to id
        }
      }
      if (Object.keys(newDynamicNames).length > 0) {
        setDynamicNames(prev => ({ ...prev, ...newDynamicNames }));
      }
    };

    fetchDynamicNames();
  }, [location.pathname]);

  if (location.pathname === '/' || location.pathname === '/login') {
    return null; // Don't show breadcrumbs on the home page и на странице логина
  }

  // Специальная обработка для /test/:testId/questions
  const isTestQuestionsPage = pathnames.length >= 3 && 
    pathnames[0] === 'test' && 
    !isNaN(Number(pathnames[1])) && 
    pathnames[2] === 'questions';

  // Получаем информацию о тесте для хлебных крошек
  const [testInfo, setTestInfo] = useState<{ 
    topic?: string; 
    topicId?: number;
    test: string;
    testId: number;
  } | null>(null);

  useEffect(() => {
    if (isTestQuestionsPage && pathnames[1]) {
      const testId = Number(pathnames[1]);
      testApi.getTest(testId)
        .then(async (test) => {
          console.log('Test data:', test);

          const info: { 
            topic?: string; 
            topicId?: number;
            test: string;
            testId: number;
          } = { 
            test: test.title,
            testId: test.id
          };
          
          console.log('Test topic_id:', test.topic_id, 'Type:', typeof test.topic_id);
          if (test.topic_id && test.topic_id > 0) {
            try {
              console.log('Attempting to fetch topic with ID:', test.topic_id);
              const topic = await topicApi.getTopic(test.topic_id);
              console.log('Fetched topic:', topic);
              info.topic = topic.title;
              info.topicId = test.topic_id;
            } catch (error) {
              console.error('Failed to fetch topic:', error);
            }
          } else {
            console.log('No valid topic_id found for test. topic_id:', test.topic_id);
          }
          

          

          console.log('Final testInfo:', info);
          setTestInfo(info);
        })
        .catch(console.error);
    }
  }, [isTestQuestionsPage, pathnames[1]]);

  return (
    <div className="container mx-auto px-6 pt-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                Главная
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          {isTestQuestionsPage && testInfo && (
            <>
              {console.log('Rendering breadcrumbs. testInfo:', testInfo, 'testInfo.topic:', testInfo.topic)}

              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/topics">Темы</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              
              {(() => {
                console.log('Conditional rendering check:', {
                  topic: testInfo.topic,
                  topicId: testInfo.topicId,
                  hasTopic: !!testInfo.topic,
                  topicLength: testInfo.topic?.length
                });
                return testInfo.topic ? (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to={`/topic/${testInfo.topicId}`}>{testInfo.topic}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                ) : (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Тема не найдена</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                );
              })()}
              

              
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/test/${testInfo.testId}`}>{testInfo.test}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Редактирование вопросов</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
          
          {/* Обычные хлебные крошки (не для страницы редактирования вопросов) */}
          {!isTestQuestionsPage && pathnames.map((value, index) => {
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;
            let name = dynamicNames[to] || breadcrumbNameMap[to] || value;

            // Исправление для /topic/:id — вместо 'topic' показываем 'Темы', а после — название темы
            if (pathnames[index - 1] === 'topic' && !isNaN(Number(value))) {
              // Не рендерим сам сегмент id, он будет показан как название темы
              name = dynamicNames[to] || value;
              return (
                <React.Fragment key={to}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </React.Fragment>
              );
            }
            if (value === 'topic') {
              return (
                <React.Fragment key={to}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/topics">Темы</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </React.Fragment>
              );
            }
            // Skip segments that are part of a larger dynamic name (like 'group' in '/teacher/group/1')
            if (pathnames[index-1] === 'teacher' && value === 'group' && !isNaN(Number(pathnames[index+1]))) {
              return null;
            }
            
            // Специальная обработка для /test/:testId/questions
            if (pathnames[index-1] === 'test' && !isNaN(Number(value)) && pathnames[index+1] === 'questions') {
              const test = dynamicNames[to];
              if (test) {
                return (
                  <React.Fragment key={to}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{test}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </React.Fragment>
                );
              }
            }
            
            // Пропускаем сегмент 'questions' в пути /test/:testId/questions
            if (pathnames[index-1] === 'test' && !isNaN(Number(pathnames[index-2])) && value === 'questions') {
              return null;
            }
            return (
              <React.Fragment key={to}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={to}>{name}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default Breadcrumbs; 