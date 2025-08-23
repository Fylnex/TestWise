import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Users, 
  GraduationCap, 
  Calendar,
  BookOpen,
  X
} from 'lucide-react';
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
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
                             <DialogTitle className="text-2xl font-semibold text-gray-900 mb-2">
                 {group.name}
               </DialogTitle>
              
                             <div className="flex items-center gap-3 text-sm text-gray-500">
                 <div className="flex items-center gap-1">
                   <Calendar className="w-4 h-4" />
                   <span>{`${group.start_year} — ${group.end_year}`}</span>
                 </div>
                 
                 {group.description && (
                   <>
                     <span>•</span>
                     <div className="flex items-center gap-1">
                       <BookOpen className="w-4 h-4" />
                       <span className="max-w-xs truncate" title={group.description}>
                         {group.description.length > 50 ? `${group.description.substring(0, 50)}...` : group.description}
                       </span>
                     </div>
                   </>
                 )}
               </div>
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
                     {teachers.length}
                   </Badge>
                 </div>
                 <Button
                   onClick={() => onAssignTeacher(group.id)}
                   variant="outline"
                   size="sm"
                   className="border-blue-200 text-blue-700 hover:bg-blue-50"
                 >
                   <Plus className="w-4 h-4 mr-2" />
                   Добавить
                 </Button>
               </div>

               <div className="space-y-3">
                 {teachers.length === 0 ? (
                   <div className="text-center py-8 text-gray-500">
                     <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                     <p>Преподаватели не назначены</p>
                   </div>
                 ) : (
                   teachers.map(teacher => (
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
                       <Button
                         size="sm"
                         variant="ghost"
                         className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                 <div className="flex items-center gap-2">
                   <Users className="w-5 h-5 text-green-600" />
                   <h3 className="text-lg font-medium text-gray-900">Студенты</h3>
                   <Badge variant="secondary" className="ml-2">
                     {students.length}
                   </Badge>
                 </div>
                 <Button
                   onClick={() => onAssignStudent(group.id)}
                   variant="outline"
                   size="sm"
                   className="border-green-200 text-green-700 hover:bg-green-50"
                 >
                   <Plus className="w-4 h-4 mr-2" />
                   Добавить
                 </Button>
               </div>

               <div className="space-y-3">
                 {students.length === 0 ? (
                   <div className="text-center py-8 text-gray-500">
                     <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                     <p>Студенты не добавлены</p>
                   </div>
                 ) : (
                   students.map(student => (
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
                         <p className="text-sm text-gray-500 truncate">
                           @{student.username}
                         </p>
                       </div>
                       <Button
                         size="sm"
                         variant="ghost"
                         className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
      </DialogContent>
    </Dialog>
  );
};

export default GroupModal;
