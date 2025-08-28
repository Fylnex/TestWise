import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, CheckCircle } from 'lucide-react';
import { Test } from '@/types/test';
import { getTestTypeInRussian } from '@/lib/utils';

interface TestInfoCardProps {
  test: Test;
  className?: string;
}

const TestInfoCard: React.FC<TestInfoCardProps> = ({ test, className = '' }) => {
  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Информация о тесте
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Тип:</span>
          <Badge variant="outline" className="text-xs">
            {getTestTypeInRussian(test.type)}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Вопросов:</span>
          <span className="text-sm text-gray-900">
            {test.questions?.length || 0}
          </span>
        </div>
        
        {test.duration && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Длительность:</span>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-900">{test.duration} мин</span>
            </div>
          </div>
        )}
        
                 <div className="flex items-center justify-between">
           <span className="text-sm font-medium text-gray-600">Попыток:</span>
           <div className="flex items-center gap-1">
             <Target className="h-4 w-4 text-gray-500" />
             <span className="text-sm text-gray-900">
               {test.max_attempts ? test.max_attempts : 'Неограниченно'}
             </span>
           </div>
         </div>
         
         <div className="flex items-center justify-between">
           <span className="text-sm font-medium text-gray-600">Процент прохождения:</span>
           <span className="text-sm text-gray-900">
             {test.completion_percentage ? test.completion_percentage : '80'}%
           </span>
         </div>
         
         <div className="flex items-center justify-between">
           <span className="text-sm font-medium text-gray-600">Вопросов в тесте:</span>
           <span className="text-sm text-gray-900">
             {test.target_questions ? test.target_questions : 'Все'}
           </span>
         </div>
      </CardContent>
    </Card>
  );
};

export default TestInfoCard;
