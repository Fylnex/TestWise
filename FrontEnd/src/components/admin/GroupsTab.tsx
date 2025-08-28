import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, BookOpen, Plus, Edit, Trash, Users, GraduationCap, Search } from 'lucide-react';
import { Group, groupApi } from '@/services/groupApi';
import { User, userApi } from '@/services/userApi';
import { toast } from 'sonner';
import GroupCard from './GroupCard';
import CreateGroupModal, { CreateGroupFormData } from './CreateGroupModal';
import EditGroupModal, { EditGroupFormData } from './EditGroupModal';
import DeleteGroupModal from './DeleteGroupModal';
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
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [createStudentModalOpen, setCreateStudentModalOpen] = useState(false);
  const [selectedGroupForStudents, setSelectedGroupForStudents] = useState<Group | null>(null);
  const [assignTeacherModalOpen, setAssignTeacherModalOpen] = useState(false);
  const [selectedGroupForTeachers, setSelectedGroupForTeachers] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<number | null>(null);
  const [removingTeacher, setRemovingTeacher] = useState<number | null>(null);
  const [removingStudent, setRemovingStudent] = useState<number | null>(null);
  const [assigningTeacher, setAssigningTeacher] = useState(false);
  const [groupStudents, setGroupStudents] = useState<User[]>([]);
  const [groupTeachers, setGroupTeachers] = useState<User[]>([]);
  const [groupStudentCounts, setGroupStudentCounts] = useState<Record<number, number>>({});
  const [groupTeacherCounts, setGroupTeacherCounts] = useState<Record<number, number>>({});
  const [groupTeachersData, setGroupTeachersData] = useState<Record<number, User[]>>({});
  const [allTeachers, setAllTeachers] = useState<User[]>([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);

  useEffect(() => {
    loadGroups();
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const allUsers = await userApi.getAllUsers();
      const teachers = allUsers.filter(u => u.role === 'teacher');
      setAllTeachers(teachers);
    } catch (error) {
      console.error('Ошибка при загрузке преподавателей:', error);
    }
  };

  // Фильтрация групп по поисковому запросу
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(group => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [groups, searchQuery]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await groupApi.getGroups();
      setGroups(response);
      setFilteredGroups(response);
      
      // Загружаем количество студентов и преподавателей для каждой группы
      const studentCounts: Record<number, number> = {};
      const teacherCounts: Record<number, number> = {};
      const teachersData: Record<number, User[]> = {};
      
      await Promise.all(
        response.map(async (group) => {
          try {
            const [students, teachers] = await Promise.all([
              getGroupStudents(group.id),
              getGroupTeachers(group.id)
            ]);
            studentCounts[group.id] = students.length;
            teacherCounts[group.id] = teachers.length;
            teachersData[group.id] = teachers;
          } catch (error) {
            studentCounts[group.id] = 0;
            teacherCounts[group.id] = 0;
            teachersData[group.id] = [];
          }
        })
      );
      
      setGroupStudentCounts(studentCounts);
      setGroupTeacherCounts(teacherCounts);
      setGroupTeachersData(teachersData);
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
      setGroupStudentCounts(prev => ({ ...prev, [newGroup.id]: 0 }));
      setCreateModalOpen(false);
      toast.success('Группа успешно создана');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при создании группы');
    }
  };

  const handleEditGroup = async (groupId: number, formData: EditGroupFormData) => {
    try {
      const updatedGroup = await groupApi.updateGroup(groupId, {
        name: formData.name,
        start_year: Number(formData.start_year),
        end_year: Number(formData.end_year),
        description: formData.description,
      });
      
      setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
      setEditModalOpen(false);
      setSelectedGroup(null);
      toast.success('Группа успешно обновлена');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при обновлении группы');
      throw error;
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    setDeletingGroup(groupId);
    try {
      await groupApi.deleteGroup(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setDeleteModalOpen(false);
      setSelectedGroup(null);
      toast.success('Группа успешно удалена');
    } catch (error) {
      toast.error('Ошибка при удалении группы');
    } finally {
      setDeletingGroup(null);
    }
  };

  const handleOpenGroupModal = async (group: Group) => {
    setSelectedGroup(group);
    
    // Загружаем студентов и преподавателей группы
    try {
      const [students, teachers] = await Promise.all([
        getGroupStudents(group.id),
        getGroupTeachers(group.id)
      ]);
      setGroupStudents(students);
      setGroupTeachers(teachers);
    } catch (error) {
      console.error('Ошибка при загрузке данных группы:', error);
      setGroupStudents([]);
      setGroupTeachers([]);
    }
    
    setGroupModalOpen(true);
  };

  const handleOpenEditModal = (group: Group) => {
    setSelectedGroup(group);
    setEditModalOpen(true);
  };

  const handleOpenDeleteModal = (group: Group) => {
    setSelectedGroup(group);
    setDeleteModalOpen(true);
  };

  const handleOpenCreateStudentModal = (group: Group) => {
    setSelectedGroupForStudents(group);
    setCreateStudentModalOpen(true);
  };

  const handleStudentsCreated = async () => {
    await loadGroups();
    if (selectedGroup) {
              // Обновляем счетчики и данные для группы
        try {
          const [students, teachers] = await Promise.all([
            getGroupStudents(selectedGroup.id),
            getGroupTeachers(selectedGroup.id)
          ]);
          
          setGroupStudentCounts(prev => ({ ...prev, [selectedGroup.id]: students.length }));
          setGroupTeacherCounts(prev => ({ ...prev, [selectedGroup.id]: teachers.length }));
          setGroupTeachersData(prev => ({ ...prev, [selectedGroup.id]: teachers }));
          
          if (groupModalOpen) {
            // Обновляем данные группы если модальное окно группы открыто
            setGroupStudents(students);
            setGroupTeachers(teachers);
          }
        } catch (error) {
          console.error('Ошибка при обновлении данных группы:', error);
        }
    }
  };

  const handleAssignTeacher = (groupId: number) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setSelectedGroupForTeachers(group);
      setAssignTeacherModalOpen(true);
      setTeacherSearch('');
      setSelectedTeacherId(null);
    }
  };

  const handleTeacherAssignment = async () => {
    if (!selectedGroupForTeachers || !selectedTeacherId) return;
    
    setAssigningTeacher(true);
    
    try {
      await groupApi.addGroupTeachers(selectedGroupForTeachers.id, [selectedTeacherId]);
      
      // Обновляем список преподавателей если модальное окно группы открыто
      if (groupModalOpen && selectedGroup?.id === selectedGroupForTeachers.id) {
        const updatedTeachers = await getGroupTeachers(selectedGroupForTeachers.id);
        setGroupTeachers(updatedTeachers);
      }
      
      // Обновляем данные в карточке группы
      const updatedTeachers = await getGroupTeachers(selectedGroupForTeachers.id);
      setGroupTeacherCounts(prev => ({ ...prev, [selectedGroupForTeachers.id]: updatedTeachers.length }));
      setGroupTeachersData(prev => ({ ...prev, [selectedGroupForTeachers.id]: updatedTeachers }));
      
      setAssignTeacherModalOpen(false);
      setSelectedGroupForTeachers(null);
      setSelectedTeacherId(null);
      setTeacherSearch('');
      toast.success('Преподаватель успешно назначен в группу');
      
    } catch (error: any) {
      console.error("Ошибка при назначении преподавателя в группу:", error);
      toast.error(error.response?.data?.detail || "Ошибка при назначении преподавателя в группу");
    } finally {
      setAssigningTeacher(false);
    }
  };

  const handleAssignStudent = (groupId: number) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      handleOpenCreateStudentModal(group);
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
      setGroupTeachers(prev => prev.filter(t => t.id !== teacherId));
      toast.success('Преподаватель удален из группы');
      
    } catch (error) {
      console.error("Ошибка при удалении преподавателя из группы:", error);
      toast.error("Ошибка при удалении преподавателя из группы");
    } finally {
      setRemovingTeacher(null);
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
      setGroupStudents(prev => prev.filter(s => s.id !== studentId));
      
      // Обновляем счетчик студентов
      setGroupStudentCounts(prev => ({
        ...prev,
        [groupId]: Math.max(0, (prev[groupId] || 1) - 1)
      }));
      
      toast.success('Студент удален из группы');
      
    } catch (error) {
      console.error("Ошибка при удалении студента из группы:", error);
      toast.error("Ошибка при удалении студента из группы");
    } finally {
      setRemovingStudent(null);
    }
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
      {title && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">
            Управление группами студентов и преподавателей
          </p>
        </div>
      )}

      {/* Groups Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск групп по названию или описанию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {showCreateButton && (
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Создать группу
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10">Загрузка...</div>
            ) : groups.length === 0 ? (
              <div className="text-center py-20">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <GraduationCap className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Группы не найдены</h3>
                <p className="text-gray-500 mb-4">
                  Создайте первую группу для начала работы
                </p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-20">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ничего не найдено</h3>
                <p className="text-gray-500 mb-4">
                  По запросу "{searchQuery}" группы не найдены
                </p>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.id} className="relative">
                  <GroupCard
                    name={group.name}
                    start_year={group.start_year}
                    end_year={group.end_year}
                    description={group.description}
                    onClick={() => onGroupSelect ? onGroupSelect(group) : handleOpenGroupModal(group)}
                    onAssignTeacher={() => handleAssignTeacher(group.id)}
                    studentCount={groupStudentCounts[group.id] || 0}
                    teachers={groupTeachersData[group.id] || []}
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {showEditButton && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(group);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {showDeleteButton && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeleteModal(group);
                        }}
                        disabled={deletingGroup === group.id}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}

                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateGroup}
        loading={false}
        error={null}
      />

      {/* Edit Group Modal */}
      <EditGroupModal
        group={selectedGroup}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedGroup(null);
        }}
        onSubmit={handleEditGroup}
        loading={false}
        error={null}
      />

      {/* Delete Group Modal */}
      <DeleteGroupModal
        group={selectedGroup}
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedGroup(null);
        }}
        onConfirm={handleDeleteGroup}
        loading={deletingGroup === selectedGroup?.id}
        error={null}
      />

      {/* Group Details Modal */}
      {selectedGroup && (
        <GroupModal
          group={selectedGroup}
          isOpen={groupModalOpen}
          onClose={() => {
            setGroupModalOpen(false);
            setSelectedGroup(null);
            setGroupStudents([]);
            setGroupTeachers([]);
          }}
          onDelete={() => handleOpenDeleteModal(selectedGroup)}
          onAssignTeacher={handleAssignTeacher}
          onAssignStudent={handleAssignStudent}
          onRemoveTeacher={handleRemoveTeacher}
          onRemoveStudent={handleRemoveStudent}
          students={groupStudents}
          teachers={groupTeachers}
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

      {/* Assign Teacher Modal */}
      <Dialog open={assignTeacherModalOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setAssignTeacherModalOpen(false);
          setSelectedGroupForTeachers(null);
          setSelectedTeacherId(null);
          setTeacherSearch('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначить преподавателя</DialogTitle>
            <DialogDescription>
              Выберите преподавателя, чтобы добавить его в группу "{selectedGroupForTeachers?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Поиск по ФИО преподавателя..."
                value={teacherSearch}
                onChange={e => setTeacherSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto border rounded-md">
              {allTeachers
                .filter(t => t.full_name.toLowerCase().includes(teacherSearch.toLowerCase()))
                .filter(t => !groupTeachers.find(gt => gt.id === t.id)) // Исключаем уже добавленных преподавателей
                .map(t => (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted ${selectedTeacherId === t.id ? 'bg-primary text-primary-foreground' : ''}`}
                    onClick={() => setSelectedTeacherId(t.id)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {t.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{t.full_name}</p>
                      <p className="text-sm text-muted-foreground">@{t.username}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleTeacherAssignment} disabled={assigningTeacher || !selectedTeacherId}>
              {assigningTeacher ? 'Назначение...' : 'Назначить'}
            </Button>
            <Button variant="outline" onClick={() => setAssignTeacherModalOpen(false)}>Отмена</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupsTab;
