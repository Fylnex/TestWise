import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  Target, 
  CheckCircle, 
  AlertCircle,
  BookOpen,
  ListChecks,
  HelpCircle
} from 'lucide-react';
import { Test } from '@/services/testApi';
import { Question } from '@/services/questionApi';
import { getTestTypeInRussian } from '@/lib/utils';

interface TestViewerProps {
  test: Test;
  questions: Question[];
}

const TestViewer: React.FC<TestViewerProps> = ({ test, questions }) => {
  return (
    <div className="space-y-8">
      {/* Основная информация */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-blue-600" />
            Информация о тесте
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Тип:</span>
              <Badge variant="secondary" className="ml-2">
                {getTestTypeInRussian(test.type)}
              </Badge>
            </div>
            <div>
              <span className="text-gray-600">Вопросов:</span>
              <span className="font-semibold ml-2">{questions.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Длительность:</span>
              <span className="font-semibold ml-2">
                {test.duration ? `${test.duration} мин` : 'Неограниченно'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Попыток:</span>
              <span className="font-semibold ml-2">
                {test.max_attempts || 'Неограниченно'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Вопросы */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <ListChecks className="h-5 w-5 text-green-600" />
            Вопросы теста
            <Badge variant="secondary" className="ml-2">
              {questions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {questions.map((q, qIdx) => (
              <Card key={q.id} className="border-2 border-gray-100">
                <CardHeader className="pb-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">{qIdx + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Вопрос {qIdx + 1}</h3>
                      <Badge variant="outline" className="text-xs">
                        {q.question_type === 'single_choice' ? 'Одиночный выбор' :
                         q.question_type === 'multiple_choice' ? 'Множественный выбор' : 'Открытый текст'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Текст вопроса</h4>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm">
                        {q.question}
                      </div>
                    </div>
                    {q.hint && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Подсказка</h4>
                        <div className="p-3 bg-blue-50 rounded-lg text-sm">
                          {q.hint}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {q.question_type === 'open_text' ? (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Правильный ответ</h4>
                      <div className="p-3 bg-green-50 rounded-lg text-sm border border-green-200">
                        {q.correct_answer}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Варианты ответов</h4>
                      <div className="space-y-2">
                        {q.options?.map((option, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-3 p-3 rounded-lg" 
                               style={{
                                 backgroundColor: q.correct_answer === oIdx || 
                                                 (Array.isArray(q.correct_answer) && q.correct_answer.includes(oIdx))
                                   ? '#dcfce7' // зеленый фон для правильного
                                   : '#f3f4f6' // серый фон для неправильного
                               }}>
                            <div className="flex items-center gap-2 flex-1">
                              {q.question_type === 'single_choice' ? (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-400 flex items-center justify-center">
                                  {q.correct_answer === oIdx && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  )}
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded border border-gray-400 flex items-center justify-center">
                                  {Array.isArray(q.correct_answer) && q.correct_answer.includes(oIdx) && (
                                    <div className="w-2 h-2 bg-blue-600 rounded"></div>
                                  )}
                                </div>
                              )}
                              <span className="text-sm">{option}</span>
                            </div>
                            {(q.correct_answer === oIdx || 
                              (Array.isArray(q.correct_answer) && q.correct_answer.includes(oIdx))) && (
                              <Badge variant="default" className="text-xs">
                                Правильный
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestViewer;
