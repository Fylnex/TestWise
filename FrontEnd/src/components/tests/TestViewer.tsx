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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-xs text-gray-500">Тип</div>
                <Badge variant="secondary" className="text-xs">
                  {getTestTypeInRussian(test.type)}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <ListChecks className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-xs text-gray-500">Вопросов</div>
                <div className="font-semibold text-sm">{questions.length}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-xs text-gray-500">Длительность</div>
                <div className="font-semibold text-sm">
                  {test.duration ? `${test.duration} мин` : '∞'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
              <Target className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-xs text-gray-500">Попыток</div>
                <div className="font-semibold text-sm">
                  {test.max_attempts || '∞'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <div>
                <div className="text-xs text-gray-500">Проходной балл</div>
                <div className="font-semibold text-sm">
                  {test.completion_percentage || 80}%
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
              <Target className="h-4 w-4 text-indigo-600" />
              <div>
                <div className="text-xs text-gray-500">Целевых вопросов</div>
                <div className="font-semibold text-sm">
                  {test.target_questions || 'Все'}
                </div>
              </div>
            </div>
          </div>
          
          {test.description && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">Описание</span>
              </div>
              <p className="text-sm text-gray-600">{test.description}</p>
            </div>
          )}
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
              <Card key={q.id} className="border border-gray-200 hover:border-blue-300 transition-colors">
                <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-blue-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-sm font-semibold text-white">{qIdx + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Вопрос {qIdx + 1}</h3>
                        <Badge variant="outline" className="text-xs">
                          {q.question_type === 'single_choice' ? 'Одиночный выбор' :
                           q.question_type === 'multiple_choice' ? 'Множественный выбор' : 'Открытый текст'}
                        </Badge>
                      </div>
                    </div>
                    {q.hint && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <HelpCircle className="h-4 w-4" />
                        <span className="text-xs">Есть подсказка</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Текст вопроса
                      </h4>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-200">
                        {q.question}
                      </div>
                    </div>
                    {q.hint && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-blue-600" />
                          Подсказка
                        </h4>
                        <div className="p-3 bg-blue-50 rounded-lg text-sm border border-blue-200">
                          {q.hint}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {q.question_type === 'open_text' ? (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Правильный ответ
                      </h4>
                      <div className="p-3 bg-green-50 rounded-lg text-sm border border-green-200">
                        {q.correct_answer}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-gray-700">Варианты ответов</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options?.map((option, oIdx) => {
                          const isCorrect = q.correct_answer === oIdx || 
                                           (Array.isArray(q.correct_answer) && q.correct_answer.includes(oIdx));
                          return (
                            <div key={oIdx} 
                                 className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                   isCorrect 
                                     ? 'bg-green-50 border-green-200' 
                                     : 'bg-gray-50 border-gray-200'
                                 }`}>
                              <div className="flex items-center gap-2 flex-1">
                                {q.question_type === 'single_choice' ? (
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    isCorrect ? 'border-green-500' : 'border-gray-400'
                                  }`}>
                                    {isCorrect && (
                                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                    )}
                                  </div>
                                ) : (
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                    isCorrect ? 'border-green-500' : 'border-gray-400'
                                  }`}>
                                    {isCorrect && (
                                      <div className="w-2 h-2 bg-green-600 rounded"></div>
                                    )}
                                  </div>
                                )}
                                <span className="text-sm">{option}</span>
                              </div>
                              {isCorrect && (
                                <Badge variant="default" className="text-xs bg-green-600">
                                  ✓ Правильный
                                </Badge>
                              )}
                            </div>
                          );
                        })}
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
