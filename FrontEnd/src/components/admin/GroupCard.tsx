import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface GroupCardProps {
  name: string;
  start_year: number;
  end_year: number;
  description?: string;
  isDemo?: boolean;
  onClick?: () => void;
  onAssignTeacher?: () => void;
  teachers?: { id: number; full_name: string; username: string }[];
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
}) => {
  return (
    <div
      className={`flex items-center justify-between p-4 border rounded-lg ${isDemo ? 'cursor-pointer hover:bg-blue-50 transition' : ''}`}
      onClick={onClick}
    >
      <div>
        <h3 className="font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground">
          {start_year}–{end_year}
        </p>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
    </div>
  );
};

export default GroupCard; 