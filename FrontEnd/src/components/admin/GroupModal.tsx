import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, GraduationCap, Calendar, BookOpen, X } from 'lucide-react';
import { Group } from '@/services/groupApi';
import { User } from '@/services/userApi';

interface GroupModalProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (groupId: number) => void;
  onAssignTeacher: (groupId: number) => void;
  onAssignStudent: (groupId: number) => void;
  onRemoveTeacher: (groupId: number, teacherId: number) => void;
  onRemoveStudent: (groupId: number, studentId: number) => void;
  students: User[];
  teachers: User[];
  deletingGroup?: number | null;
  removingTeacher?: number | null;
  removingStudent?: number | null;
}

const GroupModal: React.FC<GroupModalProps> = ({
  group,
  isOpen,
  onClose,
  onDelete,
  onAssignTeacher,
  onAssignStudent,
  onRemoveTeacher,
  onRemoveStudent,
  students,
  teachers,
  deletingGroup,
  removingTeacher,
  removingStudent
}) => {
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0][0] || '';
    return (parts[0][0] || '') + (parts[1][0] || '');
  };

  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full max-h-[85vh] p-0 rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-800 tracking-tight">
                {group.name}
              </DialogTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>{`${group.start_year} — ${group.end_year}`}</span>
                </div>
                {group.description && (
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span className="max-w-sm truncate" title={group.description}>
                      {group.description.length > 60 ? `${group.description.substring(0, 60)}...` : group.description}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-8">
            {/* Teachers Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Преподаватели</h3>
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                    {teachers.length}
                  </Badge>
                </div>
                <Button
                  onClick={() => onAssignTeacher(group.id)}
                  variant="outline"
                  size="sm"
                  className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить
                </Button>
              </div>

              <div className="space-y-3">
                {teachers.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl">
                    <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">Преподаватели не назначены</p>
                  </div>
                ) : (
                  teachers.map(teacher => (
                    <div
                      key={teacher.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-all duration-200"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">
                          {getInitials(teacher.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {teacher.full_name}
                          {teacher.patronymic && ` ${teacher.patronymic}`}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          @{teacher.username}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                        onClick={() => onRemoveTeacher(group.id, teacher.id)}
                        disabled={removingTeacher === teacher.id}
                      >
                        {removingTeacher === teacher.id ? (
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

            {/* Students Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Студенты</h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {students.length}
                  </Badge>
                </div>
                <Button
                  onClick={() => onAssignStudent(group.id)}
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-600 hover:bg-green-50 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить
                </Button>
              </div>

              <div className="space-y-3">
                {students.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">Студенты не добавлены</p>
                  </div>
                ) : (
                  students.map(student => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-all duration-200"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-green-100 text-green-700 font-medium">
                          {getInitials(student.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {student.full_name}
                          {student.patronymic && ` ${student.patronymic}`}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          @{student.username}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                        onClick={() => onRemoveStudent(group.id, student.id)}
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

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={onClose}
          >
            Закрыть
          </Button>
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
            onClick={() => onDelete(group.id)}
            disabled={deletingGroup === group.id}
          >
            {deletingGroup === group.id ? (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Удалить группу'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupModal;