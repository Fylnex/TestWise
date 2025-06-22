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
import { Home } from 'lucide-react';

// A map for static routes
const breadcrumbNameMap: { [key: string]: string } = {
  '/': 'Главная',
  '/topics': 'Темы',
  '/topics/create': 'Создание темы',
  '/about': 'О нас',
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
          {pathnames.map((value, index) => {
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