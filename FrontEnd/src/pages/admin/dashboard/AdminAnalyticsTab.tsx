import React, { useEffect, useState } from 'react';
import { StudentProgress } from '../components/admin/StudentProgress';
import { userApi, User } from '@/services/userApi';
import { groupApi, Group } from '@/services/groupApi';
import { topicApi, Topic } from '@/services/topicApi';
import { progressApi, StudentProgress as StudentProgressType } from '@/services/progressApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const AdminAnalyticsTab: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgressType | null>(null);
  const [groupProgress, setGroupProgress] = useState<{avgScore: number, completedTests: number} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [usersRes, groupsRes, topicsRes] = await Promise.all([
        userApi.getAllUsers(),
        groupApi.getGroups(),
        topicApi.getTopics(),
      ]);
      setUsers(usersRes);
      setGroups(groupsRes);
      setTopics(topicsRes);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Прогресс по студенту
  useEffect(() => {
    if (selectedStudent) {
      progressApi.getStudentProgress(selectedStudent).then(setStudentProgress);
    } else {
      setStudentProgress(null);
    }
  }, [selectedStudent]);

  // Прогресс по группе (агрегация)
  useEffect(() => {
    async function fetchGroupProgress() {
      if (!selectedGroup) {
        setGroupProgress(null);
        return;
      }
      // Получаем студентов группы
      const groupStudents = await groupApi.getGroupStudents(selectedGroup);
      if (!groupStudents.length) {
        setGroupProgress({ avgScore: 0, completedTests: 0 });
        return;
      }
      // Получаем прогресс каждого студента
      const progresses = await Promise.all(
        groupStudents.map(async (gs) => {
          try {
            return await progressApi.getStudentProgress(gs.user_id);
          } catch {
            return null;
          }
        })
      );
      const valid = progresses.filter(Boolean) as StudentProgressType[];
      const completedTests = valid.reduce((sum, p) => sum + p.completedTests, 0);
      const avgScore = valid.length > 0 ? Math.round(valid.reduce((sum, p) => sum + p.averageScore, 0) / valid.length) : 0;
      setGroupProgress({ avgScore, completedTests });
    }
    fetchGroupProgress();
  }, [selectedGroup]);

  const teachersCount = users.filter(u => u.role === 'teacher').length;
  const studentsCount = users.filter(u => u.role === 'student').length;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Аналитика</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Группы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{groups.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Преподаватели</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{teachersCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Студенты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{studentsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Темы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{topics.length}</div>
          </CardContent>
        </Card>
      </div>
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Прогресс по студенту</h3>
        <Select
          onValueChange={val => setSelectedStudent(Number(val))}
          value={selectedStudent?.toString() || ''}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Выберите студента" />
          </SelectTrigger>
          <SelectContent>
            {users.filter(u => u.role === 'student').map((user) => (
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
                <CardTitle>Выполненные тесты: {studentProgress.completedTests}</CardTitle>
                <div>Средний балл: {studentProgress.averageScore}%</div>
                <div>Последняя активность: {new Date(studentProgress.lastActivity).toLocaleDateString()}</div>
              </CardHeader>
              <CardContent>
                <div className="font-semibold mb-2">История тестов:</div>
                {studentProgress.testHistory.length > 0 ? (
                  <ul className="list-disc pl-6">
                    {studentProgress.testHistory.map((test, idx) => (
                      <li key={idx}>
                        Тест #{test.testId}: {test.score}% ({new Date(test.date).toLocaleDateString()})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-muted-foreground">Нет данных о тестах</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Прогресс по группе</h3>
        <Select
          onValueChange={val => setSelectedGroup(Number(val))}
          value={selectedGroup?.toString() || ''}
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
                <CardTitle>Выполненные тесты: {groupProgress.completedTests}</CardTitle>
                <div>Средний балл: {groupProgress.avgScore}%</div>
              </CardHeader>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsTab; 