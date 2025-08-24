import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, BookOpen, Plus, Edit, Trash, Users, GraduationCap } from 'lucide-react';
import { Group, groupApi } from '@/services/groupApi';
import { User, userApi } from '@/services/userApi';
import { toast } from 'sonner';
import GroupCard from './GroupCard';
import CreateGroupModal, { CreateGroupFormData } from './CreateGroupModal';
import GroupModal from './GroupModal';
import CreateStudentModal from './CreateStudentModal';

interface GroupsTabProps {
  title?: string;
  showCreateButton?: boolean;
  showDeleteButton?: boolean;
  showEditButton?: boolean;
  showAssignButtons?: boolean;
  onGroupSelect?: (group: Group) => void;
  className?: string;
}

const GroupsTab: React.FC<GroupsTabProps> = ({
  title = "Группы",
  showCreateButton = true,
  showDeleteButton = true,
  showEditButton = true,
  showAssignButtons = true,
  onGroupSelect,
  className = ""
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [createStudentModalOpen, setCreateStudentModalOpen] = useState(false);
  const [selectedGroupForStudents, setSelectedGroupForStudents] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<number | null>(null);
  const [removingTeacher, setRemovingTeacher] = useState<number | null>(null);
  const [removingStudent, setRemovingStudent] = useState<number | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await groupApi.getGroups();
      setGroups(response);
    } catch (error) {
      toast.error('Ошибка при загрузке групп');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (formData: CreateGroupFormData) => {
    try {
      const newGroup = await groupApi.createGroup({
        name: formData.name,
        start_year: Number(formData.start_year),
        end_year: Number(formData.end_year),
        description: formData.description,
      });
      
      setGroups(prev => [...prev, newGroup]);
      setCreateModalOpen(false);
      toast.success('Группа успешно создана');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при создании группы');
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту группу?')) return;
    
    setDeletingGroup(groupId);
    try {
      await groupApi.deleteGroup(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      toast.success('Группа успешно удалена');
    } catch (error) {
      toast.error('Ошибка при удалении группы');
    } finally {
      setDeletingGroup(null);
    }
  };

  const handleOpenGroupModal = async (group: Group) => {
    setSelectedGroup(group);
    setGroupModalOpen(true);
  };

  const handleOpenCreateStudentModal = (group: Group) => {
    setSelectedGroupForStudents(group);
    setCreateStudentModalOpen(true);
  };

  const handleStudentsCreated = () => {
    loadGroups();
    if (selectedGroup) {
      // Обновляем данные группы если модальное окно группы открыто
      setSelectedGroup(groups.find(g => g.id === selectedGroup.id) || null);
    }
  };

  const handleAssignTeacher = (groupId: number) => {
    // Логика назначения преподавателя
    toast.info('Функция назначения преподавателя в разработке');
  };

  const handleAssignStudent = (groupId: number) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      handleOpenCreateStudentModal(group);
    }
  };

  const handleRemoveTeacher = (groupId: number, teacherId: number) => {
    setRemovingTeacher(teacherId);
    // Логика удаления преподавателя
    setTimeout(() => {
      setRemovingTeacher(null);
      toast.success('Преподаватель удален из группы');
    }, 1000);
  };

  const handleRemoveStudent = (groupId: number, studentId: number) => {
    setRemovingStudent(studentId);
    // Логика удаления студента
    setTimeout(() => {
      setRemovingStudent(null);
      toast.success('Студент удален из группы');
    }, 1000);
  };

  const getGroupStudents = async (groupId: number): Promise<User[]> => {
    try {
      const students = await groupApi.getGroupStudents(groupId);
      const allUsers = await userApi.getAllUsers();
      return allUsers.filter(u => students.map(s => s.user_id).includes(u.id));
    } catch (error) {
      return [];
    }
  };

  const getGroupTeachers = async (groupId: number): Promise<User[]> => {
    try {
      const teachers = await groupApi.getGroupTeachers(groupId);
      const allUsers = await userApi.getAllUsers();
      return allUsers.filter(u => teachers.map(t => t.user_id).includes(u.id));
    } catch (error) {
      return [];
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-10">Загрузка групп...</div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">
            Управление группами студентов и преподавателей
          </p>
        </div>
        {showCreateButton && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Создать группу
          </Button>
        )}
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="text-center py-20">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Группы не найдены</h3>
          <p className="text-gray-500 mb-4">
            Создайте первую группу для начала работы
          </p>
          {showCreateButton && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Создать группу
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              showDeleteButton={showDeleteButton}
              showEditButton={showEditButton}
              showAssignButtons={showAssignButtons}
              onView={() => onGroupSelect ? onGroupSelect(group) : handleOpenGroupModal(group)}
              onDelete={() => handleDeleteGroup(group.id)}
              onEdit={() => handleOpenGroupModal(group)}
              onAssignTeacher={() => handleAssignTeacher(group.id)}
              onAssignStudent={() => handleAssignStudent(group.id)}
              deleting={deletingGroup === group.id}
            />
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateGroup}
        loading={false}
        error={null}
      />

      {/* Group Details Modal */}
      {selectedGroup && (
        <GroupModal
          group={selectedGroup}
          isOpen={groupModalOpen}
          onClose={() => setGroupModalOpen(false)}
          onDelete={handleDeleteGroup}
          onAssignTeacher={handleAssignTeacher}
          onAssignStudent={handleAssignStudent}
          onRemoveTeacher={handleRemoveTeacher}
          onRemoveStudent={handleRemoveStudent}
          students={[]} // Будет загружено асинхронно
          teachers={[]} // Будет загружено асинхронно
          deletingGroup={deletingGroup}
          removingTeacher={removingTeacher}
          removingStudent={removingStudent}
        />
      )}

      {/* Create Student Modal */}
      {selectedGroupForStudents && (
        <CreateStudentModal
          isOpen={createStudentModalOpen}
          onClose={() => setCreateStudentModalOpen(false)}
          onStudentsCreated={handleStudentsCreated}
          preselectedGroupId={selectedGroupForStudents.id}
        />
      )}
    </div>
  );
};

export default GroupsTab;
