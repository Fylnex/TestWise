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
import GroupModal from "@/components/admin/GroupModal";
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
  const [removingTeacher, setRemovingTeacher] = useState<number | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<number | null>(null);
  const [allStudents, setAllStudents] = useState<User[]>([]);


  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const fetchData = async () => {
      try {
        const [groupsData, myGroupsData, allUsersData, myTopicsData] = await Promise.all([
          groupApi.getGroups(),
          groupApi.getMyGroups(),
          userApi.getAllUsers(),
          topicApi.getMyTopics()
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
        setMyTopics(myTopicsData);
        console.log("Загружено тем:", myTopicsData.length);
        setLoading(false);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
        console.error("Детали ошибки:", error.response?.data || error.message);
        setError("Ошибка при загрузке данных");
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

  const handleRemoveTeacher = async (groupId: number, teacherId: number) => {
    if (!confirm('Вы уверены, что хотите удалить преподавателя из группы?')) {
      return;
    }
    
    setRemovingTeacher(teacherId);
    
    try {
      await groupApi.removeGroupTeacher(groupId, teacherId);
      
      // Обновляем список преподавателей группы
      setViewGroupTeachers(prev => prev.filter(t => t.id !== teacherId));
      
    } catch (error) {
      console.error("Ошибка при удалении преподавателя из группы:", error);
      alert("Ошибка при удалении преподавателя из группы");
    } finally {
      setRemovingTeacher(null);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('Вы уверены, что хотите удалить группу? Это действие нельзя отменить.')) {
      return;
    }
    
    setDeletingGroup(groupId);
    
    try {
      await groupApi.deleteGroup(groupId);
      
      // Обновляем список групп
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setViewGroupModal(null);
      
    } catch (error) {
      console.error("Ошибка при удалении группы:", error);
      alert("Ошибка при удалении группы");
    } finally {
      setDeletingGroup(null);
    }
  };

  const handleAssignTeacher = (groupId: number) => {
    // Будет реализовано позже, если потребуется
    console.log("Assign teacher to group", groupId);
  };

  const handleAssignStudentToGroup = (groupId: number) => {
    setAssignStudentModal(groupId);
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
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <p>Ошибка при загрузке тем: {error}</p>
                </div>
              ) : myTopics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>У вас пока нет созданных тем</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTopics.map((topic) => (
                    <div key={topic.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{topic.title}</h3>
                      {topic.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                          {topic.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Создана: {topic.created_at ? new Date(topic.created_at).toLocaleDateString() : 'Не указано'}</span>
                          {topic.updated_at && (
                            <span>Обновлена: {new Date(topic.updated_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={topic.is_archived ? "secondary" : "default"} className="text-xs">
                          {topic.is_archived ? 'Архив' : 'Активна'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          ID: {topic.id}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>



      {/* Модальное окно просмотра группы */}
      <GroupModal
        group={viewGroupModal}
        isOpen={!!viewGroupModal}
        onClose={() => {
          setViewGroupModal(null);
          setViewGroupStudents([]);
          setViewGroupTeachers([]);
        }}
        onDelete={handleDeleteGroup}
        onAssignTeacher={handleAssignTeacher}
        onAssignStudent={handleAssignStudentToGroup}
        onRemoveTeacher={handleRemoveTeacher}
        onRemoveStudent={handleRemoveStudent}
        students={viewGroupStudents}
        teachers={viewGroupTeachers}
        deletingGroup={deletingGroup}
        removingTeacher={removingTeacher}
        removingStudent={removingStudent}
      />

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