import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Group, groupApi } from "@/services/groupApi";
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
import { useAuth } from "@/context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { progressApi } from "@/services/progressApi";
import { User, userApi } from "@/services/userApi";
import { Topic, topicApi } from "@/services/topicApi";
import GroupCard from "@/components/admin/GroupCard";

import { Calendar, BookOpen, GraduationCap, Users, Plus, X, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import CreateGroupModal, { CreateGroupFormData } from "@/components/admin/CreateGroupModal";
import GroupsTab from "@/components/admin/GroupsTab";

export default function TeacherDashboard({
  withoutLayout = false,
}: {
  withoutLayout?: boolean;
}) {
  // Функция для получения инициалов
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0][0] || '';
    return (parts[0][0] || '') + (parts[1][0] || '');
  };

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [analyticsTab, setAnalyticsTab] = useState<
    "groups" | "analytics" | "content"
  >("groups");
  const [groupStudents, setGroupStudents] = useState<{
    [groupId: number]: User[];
  }>({});
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [studentProgress, setStudentProgress] = useState<any>(null);
  const [groupProgress, setGroupProgress] = useState<{
    avgScore: number;
    completedTests: number;
  } | null>(null);
  const [myTopics, setMyTopics] = useState<Topic[]>([]); // Убедимся, что тип корректен

  const [viewGroupModal, setViewGroupModal] = useState<Group | null>(null);
  const [viewGroupStudents, setViewGroupStudents] = useState<User[]>([]);
  const [viewGroupTeachers, setViewGroupTeachers] = useState<User[]>([]);
  const [assignStudentModal, setAssignStudentModal] = useState<number | null>(null);
  const [assignStudentId, setAssignStudentId] = useState<number | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [assigningStudent, setAssigningStudent] = useState(false);
  const [assignStudentError, setAssignStudentError] = useState<string | null>(null);
  const [removingStudent, setRemovingStudent] = useState<number | null>(null);
  const [allStudents, setAllStudents] = useState<User[]>([]);


  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const fetchData = async () => {
      try {
        const [groupsData, myGroupsData, allUsersData] = await Promise.all([
          groupApi.getGroups(),
          groupApi.getMyGroups(),
          userApi.getAllUsers()
        ]);

        // Проверяем преподавателей для всех групп
        console.log('=== ПРОВЕРКА ВСЕХ ГРУПП ===');
        for (const group of groupsData.slice(0, 3)) { // Проверяем первые 3 группы
          try {
            const teachers = await groupApi.getGroupTeachers(group.id);
            console.log(`Группа "${group.name}" (ID: ${group.id}):`, teachers);
          } catch (error) {
            console.error(`Ошибка при получении преподавателей для группы ${group.id}:`, error);
          }
        }
        console.log('=== КОНЕЦ ПРОВЕРКИ ===');

        setGroups(groupsData);
        setAllStudents(allUsersData.filter(u => u.role === 'student'));
        setLoading(false);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Отслеживаем изменения состояния преподавателей
  useEffect(() => {
    console.log('Состояние viewGroupTeachers изменилось:', viewGroupTeachers);
  }, [viewGroupTeachers]);

  // Аналитика: прогресс по студенту
  useEffect(() => {
    if (selectedStudent) {
      progressApi.getStudentProgress(selectedStudent).then(setStudentProgress);
    } else {
      setStudentProgress(null);
    }
  }, [selectedStudent]);

  // Аналитика: прогресс по группе
  useEffect(() => {
    async function fetchGroupProgress() {
      if (!selectedGroup) {
        setGroupProgress(null);
        return;
      }
      const groupStudentsArr = groupStudents[selectedGroup] || [];
      if (!groupStudentsArr.length) {
        setGroupProgress({ avgScore: 0, completedTests: 0 });
        return;
      }
      const progresses = await Promise.all(
        groupStudentsArr.map(async (u) => {
          try {
            return await progressApi.getStudentProgress(u.id);
          } catch {
            return null;
          }
        }),
      );
      const valid = progresses.filter(Boolean);
      const completedTests = valid.reduce(
        (sum, p) => sum + p.completedTests,
        0,
      );
      const avgScore =
        valid.length > 0
          ? Math.round(
              valid.reduce((sum, p) => sum + p.averageScore, 0) / valid.length,
            )
          : 0;
      setGroupProgress({ avgScore, completedTests });
    }
    fetchGroupProgress();
  }, [selectedGroup, groupStudents]);

  const handleCreate = async (formData: CreateGroupFormData) => {
    setCreating(true);
    setError(null);
    try {
      if (!formData.name.trim() || !formData.start_year || !formData.end_year) {
        setError("Все поля обязательны для заполнения");
        return;
      }
      
      if (Number(formData.start_year) >= Number(formData.end_year)) {
        setError("Год окончания должен быть больше года начала");
        return;
      }
      
      if (formData.student_count && Number(formData.student_count) < 1) {
        setError("Количество студентов должно быть не менее 1");
        return;
      }
      
      const newGroup = await groupApi.createGroup({
        name: formData.name,
        start_year: Number(formData.start_year),
        end_year: Number(formData.end_year),
        description: formData.description,
      });
      
      setGroups(prev => [...prev, newGroup]);
        setOpen(false);
      setError(null);
    } catch (err: any) {
      console.error("Ошибка при создании группы:", err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Ошибка при создании группы");
      }
    } finally {
      setCreating(false);
    }
  };



  const openViewGroupModal = async (group: Group) => {
    setViewGroupModal(group);
    try {
      console.log('=== ДИАГНОСТИКА ОТКРЫТИЯ ГРУППЫ ===');
      console.log('Группа:', group);
      console.log('Текущий пользователь:', user);
      console.log('Роль пользователя:', user?.role);
      
      // Загружаем студентов и преподавателей группы точно так же, как в админ панели
      console.log('Вызываем API для группы ID:', group.id);
      
      const studentsResponse = await groupApi.getGroupStudents(group.id);
      const teachersResponse = await groupApi.getGroupTeachers(group.id);
      
      console.log('Ответ API getGroupStudents:', studentsResponse);
      console.log('Ответ API getGroupTeachers:', teachersResponse);
      
      // Проверяем структуру ответов
      console.log('Тип studentsResponse:', typeof studentsResponse, Array.isArray(studentsResponse));
      console.log('Тип teachersResponse:', typeof teachersResponse, Array.isArray(teachersResponse));
      
      if (Array.isArray(studentsResponse)) {
        console.log('Структура первого студента:', studentsResponse[0]);
      }
      
      if (Array.isArray(teachersResponse)) {
        console.log('Структура первого преподавателя:', teachersResponse[0]);
      }
      
      const [studs, teachers] = [
        studentsResponse.map(s => s.user_id),
        teachersResponse.map(t => t.user_id)
      ];
      
      console.log('ID студентов:', studs);
      console.log('ID преподавателей:', teachers);
      
      const allUsers = await userApi.getAllUsers();
      console.log('Все пользователи загружены:', allUsers.length);
      console.log('Примеры пользователей:', allUsers.slice(0, 3));
      console.log('Структура первого пользователя:', allUsers[0] ? {
        id: allUsers[0].id,
        full_name: allUsers[0].full_name,
        username: allUsers[0].username,
        role: allUsers[0].role
      } : 'Нет пользователей');
      
      const groupStudents = allUsers.filter(u => studs.includes(u.id));
      const groupTeachers = allUsers.filter(u => teachers.includes(u.id));
      
      console.log('Отфильтрованные студенты:', groupStudents);
      console.log('Отфильтрованные преподаватели:', groupTeachers);
      console.log('=== КОНЕЦ ДИАГНОСТИКИ ===');
      
      console.log('Устанавливаем состояние:');
      console.log('- viewGroupStudents:', groupStudents);
      console.log('- viewGroupTeachers:', groupTeachers);
      
      setViewGroupStudents(groupStudents);
      setViewGroupTeachers(groupTeachers);
      
      // Проверяем состояние после установки
      setTimeout(() => {
        console.log('Состояние после установки:');
        console.log('- viewGroupStudents:', viewGroupStudents);
        console.log('- viewGroupTeachers:', viewGroupTeachers);
      }, 100);
    } catch (error) {
      console.error("Ошибка при загрузке данных группы:", error);
      console.error("Детали ошибки:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Проверяем конкретные ошибки
      if (error.response?.status === 403) {
        console.error("ОШИБКА 403: У пользователя нет прав для просмотра преподавателей группы");
      } else if (error.response?.status === 401) {
        console.error("ОШИБКА 401: Пользователь не авторизован");
      } else if (error.response?.status === 404) {
        console.error("ОШИБКА 404: Группа не найдена");
      }
      
      setViewGroupStudents([]);
      setViewGroupTeachers([]);
    }
  };

  const handleAssignStudent = async () => {
    if (!assignStudentModal || !assignStudentId) return;
    
    setAssigningStudent(true);
    setAssignStudentError(null);
    
    try {
      await groupApi.addGroupStudents(assignStudentModal, [assignStudentId]);
      
      // Обновляем список студентов группы
      const students = await groupApi.getGroupStudents(assignStudentModal);
      const allUsers = await userApi.getAllUsers();
      const updatedStudents = allUsers.filter(u => 
        students.map(s => s.user_id).includes(u.id)
      );
      setViewGroupStudents(updatedStudents);
      
      // Обновляем локальное состояние групп
      const updatedGroupStudents = { ...groupStudents };
      updatedGroupStudents[assignStudentModal] = updatedStudents;
      setGroupStudents(updatedGroupStudents);
      
      // Закрываем модальное окно
      setAssignStudentModal(null);
      setAssignStudentId(null);
      setStudentSearch('');
      
    } catch (error) {
      console.error("Ошибка при назначении студента:", error);
      setAssignStudentError("Ошибка при назначении студента в группу");
    } finally {
      setAssigningStudent(false);
    }
  };

  const handleRemoveStudent = async (groupId: number, studentId: number) => {
    if (!confirm('Вы уверены, что хотите удалить студента из группы?')) {
      return;
    }
    
    setRemovingStudent(studentId);
    
    try {
      await groupApi.removeGroupStudent(groupId, studentId);
      
      // Обновляем список студентов группы
      setViewGroupStudents(prev => prev.filter(s => s.id !== studentId));
      
      // Обновляем локальное состояние групп
      const updatedGroupStudents = { ...groupStudents };
      if (updatedGroupStudents[groupId]) {
        updatedGroupStudents[groupId] = updatedGroupStudents[groupId].filter(s => s.id !== studentId);
        setGroupStudents(updatedGroupStudents);
      }
      
    } catch (error) {
      console.error("Ошибка при удалении студента из группы:", error);
      alert("Ошибка при удалении студента из группы");
    } finally {
      setRemovingStudent(null);
    }
  };



  const content = (
            <div className="max-w-[1000px] mx-auto px-6 py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Панель управления</h1>
      </div>

      {/* Основной контент */}
      <Tabs value={analyticsTab} onValueChange={(value) => setAnalyticsTab(value as any)}>
        <TabsList>
          <TabsTrigger value="groups">Группы</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          <TabsTrigger value="topics">Темы</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-4">
          <GroupsTab 
            title=""
            showCreateButton={true}
            showDeleteButton={false}
            showEditButton={true}
            showAssignButtons={true}
            onGroupSelect={openViewGroupModal}
            className="px-0 py-0"
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Аналитика</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Мои группы</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {groups.length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Студенты в группах</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Object.values(groupStudents).reduce(
                      (sum, arr) => sum + arr.length,
                      0,
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-2">
                Прогресс по студенту
              </h3>
              <Select
                onValueChange={(val) => setSelectedStudent(Number(val))}
                value={selectedStudent?.toString() || ""}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Выберите студента" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(groupStudents)
                    .flat()
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.full_name || user.username}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {studentProgress && (
                <div className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Выполненные тесты: {studentProgress.completedTests}
                      </CardTitle>
                      <div>Средний балл: {studentProgress.averageScore}%</div>
                      <div>
                        Последняя активность:{" "}
                        {new Date(
                          studentProgress.lastActivity,
                        ).toLocaleDateString()}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="font-semibold mb-2">История тестов:</div>
                      {studentProgress.testHistory.length > 0 ? (
                        <ul className="list-disc pl-6">
                          {studentProgress.testHistory.map((test, idx) => (
                            <li key={idx}>
                              Тест #{test.testId}: {test.score}% (
                              {new Date(test.date).toLocaleDateString()})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-muted-foreground">
                          Нет данных о тестах
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-2">Прогресс по группе</h3>
              <Select
                onValueChange={(val) => setSelectedGroup(Number(val))}
                value={selectedGroup?.toString() || ""}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Выберите группу" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {groupProgress && (
                <div className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Выполненные тесты: {groupProgress.completedTests}
                      </CardTitle>
                      <div>Средний балл: {groupProgress.avgScore}%</div>
                    </CardHeader>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Мои темы</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-10">Загрузка...</div>
              ) : myTopics.length === 0 ? (
                <div className="text-muted-foreground">
                  У вас пока нет созданных тем.
                </div>
              ) : (
                <div className="space-y-4">
                  {myTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="border rounded p-3 bg-slate-50"
                    >
                      <div className="font-semibold text-lg">{topic.title}</div>
                      {topic.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {topic.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>



      {/* Модальное окно просмотра группы */}
      <Dialog open={!!viewGroupModal} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setViewGroupModal(null);
          setViewGroupStudents([]);
          setViewGroupTeachers([]);
        }
      }}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden p-0">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-semibold text-gray-900 mb-2">
                  {viewGroupModal?.name}
                </DialogTitle>
                
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{viewGroupModal ? `${viewGroupModal.start_year} — ${viewGroupModal.end_year}` : ''}</span>
                  </div>
                  
                  {viewGroupModal?.description && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span className="max-w-xs truncate" title={viewGroupModal.description}>
                          {viewGroupModal.description.length > 50 ? `${viewGroupModal.description.substring(0, 50)}...` : viewGroupModal.description}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Просмотр информации о группе и управление составом
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-8">
              {/* Teachers Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-gray-900">Преподаватели</h3>
                    <Badge variant="secondary" className="ml-2">
                      {viewGroupTeachers.length}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {viewGroupTeachers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Преподаватели не назначены</p>
                    </div>
                  ) : (
                    viewGroupTeachers.map(teacher => (
                      <div key={teacher.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {getInitials(teacher.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {teacher.full_name}
                            {teacher.patronymic && ` ${teacher.patronymic}`}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            @{teacher.username}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Students Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-medium text-gray-900">Студенты</h3>
                    <Badge variant="secondary" className="ml-2">
                      {viewGroupStudents.length}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => setAssignStudentModal(viewGroupModal?.id || null)}
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить студента
                  </Button>
                </div>

                <div className="space-y-3">
                  {viewGroupStudents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Студенты не добавлены</p>
                    </div>
                  ) : (
                    viewGroupStudents.map(student => (
                      <div key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {getInitials(student.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {student.full_name}
                            {student.patronymic && ` ${student.patronymic}`}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            @{student.username}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveStudent(viewGroupModal?.id || 0, student.id)}
                          disabled={removingStudent === student.id}
                        >
                          {removingStudent === student.id ? (
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно назначения студента */}
      <Dialog open={!!assignStudentModal} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setAssignStudentModal(null);
          setAssignStudentId(null);
          setStudentSearch('');
          setAssignStudentError(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить студента</DialogTitle>
            <DialogDescription>
              Выберите студента, чтобы добавить его в группу "{groups.find(g => g.id === assignStudentModal)?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Поиск по ФИО студента..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto border rounded-md">
              {allStudents
                .filter(s => s.full_name.toLowerCase().includes(studentSearch.toLowerCase()))
                .filter(s => !viewGroupStudents.find(gs => gs.id === s.id)) // Исключаем уже добавленных студентов
                .map(s => (
                  <div
                    key={s.id}
                    className={`p-2 cursor-pointer hover:bg-muted ${assignStudentId === s.id ? 'bg-primary text-primary-foreground' : ''}`}
                    onClick={() => setAssignStudentId(s.id)}
                  >
                    {s.full_name}
                  </div>
                ))}
            </div>
            {assignStudentError && <div className="text-red-500 text-sm">{assignStudentError}</div>}
          </div>
          <DialogFooter>
            <Button onClick={handleAssignStudent} disabled={assigningStudent || !assignStudentId}>
              {assigningStudent ? 'Добавление...' : 'Добавить'}
            </Button>
            <Button variant="outline" onClick={() => setAssignStudentModal(null)}>Отмена</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модальное окно создания группы */}
      <CreateGroupModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSubmit={handleCreate}
        loading={creating}
        error={error}
      />
    </div>
  );
  return withoutLayout ? content : <Layout>{content}</Layout>;
}