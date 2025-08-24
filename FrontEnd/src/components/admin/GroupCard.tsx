import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Users } from 'lucide-react';

interface GroupCardProps {
  name: string;
  start_year: number;
  end_year: number;
  description?: string;
  isDemo?: boolean;
  onClick?: () => void;
  onAssignTeacher?: () => void;
  teachers?: { id: number; full_name: string; username: string }[];
  studentCount?: number;
}

const GroupCard: React.FC<GroupCardProps> = ({
  name,
  start_year,
  end_year,
  description,
  isDemo = false,
  onClick,
  onAssignTeacher,
  teachers = [],
  studentCount = 0,
}) => {
  return (
    <div
      className={`flex items-center justify-between p-4 border rounded-lg ${isDemo ? 'cursor-pointer hover:bg-blue-50 transition' : ''}`}
      onClick={onClick}
    >
      <div>
        <h3 className="font-semibold">{name}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{start_year}–{end_year}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{studentCount} студент{studentCount === 1 ? '' : studentCount < 5 ? 'а' : 'ов'}</span>
          </div>
        </div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
    </div>
  );
};

export default GroupCard; 