import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  FileText, 
  X,
  ChevronDown,
  ChevronUp,
  GripVertical
} from 'lucide-react';
import { 
  QuestionForm, 
  convertCorrectAnswerToIndex, 
  convertMultipleChoiceCorrectAnswerToIndices,
  createEmptyQuestion 
} from '@/utils/questionUtils';

interface QuestionEditorProps {
  questions: QuestionForm[];
  onQuestionsChange: (questions: QuestionForm[]) => void;
  isViewMode?: boolean;
  showHints?: boolean; // Показывать ли поле подсказки
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ 
  questions, 
  onQuestionsChange, 
  isViewMode = false,
  showHints = true
}) => {
  const [collapsedQuestions, setCollapsedQuestions] = useState<Set<number>>(new Set());

  const handleQuestionChange = (idx: number, field: keyof QuestionForm, value: any) => {
    const updatedQuestions = questions.map((q, i) => {
      if (i === idx) {
        const updatedQuestion = { ...q, [field]: value };

        if (field === 'question_type') {
          if (value === 'open_text') {
            updatedQuestion.options = undefined;
            updatedQuestion.correct_answer = '';
          } else if (value === 'single_choice') {
            updatedQuestion.options = q.options || ['', ''];
            // Преобразуем строковый correct_answer в индекс, если он есть
            updatedQuestion.correct_answer = convertCorrectAnswerToIndex(q.correct_answer, q.options || ['', '']);
          } else if (value === 'multiple_choice') {
            updatedQuestion.options = q.options || ['', ''];
            // Преобразуем строковый correct_answer в массив индексов
            updatedQuestion.correct_answer = convertMultipleChoiceCorrectAnswerToIndices(q.correct_answer, q.options || ['', '']);
          }
        }

        return updatedQuestion;
      }
      return q;
    });
    onQuestionsChange(updatedQuestions);
  };

  const handleOptionChange = (qIdx: number, oIdx: number, value: string) => {
    const updatedQuestions = questions.map((q, i) => {
      if (i === qIdx) {
        const updatedOptions = q.options?.map((o, j) => j === oIdx ? value : o);
        
        // Если изменяем опцию, которая является правильным ответом, обновляем correct_answer
        let updatedCorrectAnswer = q.correct_answer;
        if (typeof q.correct_answer === 'number' && q.correct_answer === oIdx) {
          // Если это одиночный выбор и мы изменили правильный ответ, обновляем его
          updatedCorrectAnswer = oIdx;
        } else if (Array.isArray(q.correct_answer) && q.correct_answer.includes(oIdx)) {
          // Если это множественный выбор и мы изменили один из правильных ответов
          updatedCorrectAnswer = q.correct_answer.map(idx => idx === oIdx ? oIdx : idx);
        }
        
        return {
          ...q,
          options: updatedOptions,
          correct_answer: updatedCorrectAnswer
        };
      }
      return q;
    });
    onQuestionsChange(updatedQuestions);
  };

  const handleCorrectAnswerChange = (qIdx: number, value: number | number[] | string) => {
    const updatedQuestions = questions.map((q, i) => i === qIdx ? { ...q, correct_answer: value } : q);
    onQuestionsChange(updatedQuestions);
  };

  const addQuestion = () => {
    onQuestionsChange([...questions, createEmptyQuestion()]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length > 1) {
      const updatedQuestions = questions.map((q, i) => {
        if (i === idx) {
          if (q.id && !q.isNew) {
            return { ...q, isDeleted: true };
          }
        }
        return q;
      }).filter((q, i) => i !== idx || (q.id && !q.isNew && q.isDeleted));
      onQuestionsChange(updatedQuestions);
    }
  };

  const addAnswer = (qIdx: number) => {
    const updatedQuestions = questions.map((q, i) => i === qIdx ? {
      ...q,
      options: q.options ? [...q.options, ''] : ['', '']
    } : q);
    onQuestionsChange(updatedQuestions);
  };

  const removeAnswer = (qIdx: number, aIdx: number) => {
    const updatedQuestions = questions.map((q, i) => i === qIdx ? {
      ...q,
      options: q.options && q.options.length > 2 ? q.options.filter((_, j) => j !== aIdx) : q.options
    } : q);
    onQuestionsChange(updatedQuestions);
  };

  const toggleQuestionCollapse = (qIdx: number) => {
    setCollapsedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(qIdx)) {
        newSet.delete(qIdx);
      } else {
        newSet.add(qIdx);
      }
      return newSet;
    });
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= questions.length) return;
    
    const updatedQuestions = [...questions];
    const [movedQuestion] = updatedQuestions.splice(fromIndex, 1);
    updatedQuestions.splice(toIndex, 0, movedQuestion);
    onQuestionsChange(updatedQuestions);
  };

  const activeQuestions = questions.filter(q => !q.isDeleted);

  return (
    <div className="space-y-4">
      {activeQuestions.map((q, qIdx) => {
        const originalIdx = questions.findIndex(orig => orig === q);
        const isCollapsed = collapsedQuestions.has(originalIdx);
        
        return (
          <Card key={originalIdx} className="border-2 border-gray-100 hover:border-blue-200 transition-colors">
            <CardHeader className="pb-2 bg-gray-50 cursor-pointer" onClick={() => toggleQuestionCollapse(originalIdx)}>
              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                   <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                     <span className="text-xs font-semibold text-blue-600">{qIdx + 1}</span>
                   </div>
                   <Badge variant="outline" className="text-xs">
                     {q.question_type === 'single_choice' ? 'Одиночный выбор' :
                      q.question_type === 'multiple_choice' ? 'Множественный выбор' : 'Открытый текст'}
                   </Badge>
                   <div className="flex-1">
                     <h3 className="font-semibold text-sm truncate">{q.text || 'Вопрос без текста'}</h3>
                   </div>
                 </div>
                <div className="flex items-center gap-2">
                  {!isViewMode && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQuestion(originalIdx, originalIdx - 1);
                        }}
                        disabled={originalIdx === 0}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQuestion(originalIdx, originalIdx + 1);
                        }}
                        disabled={originalIdx === activeQuestions.length - 1}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      {activeQuestions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQuestion(originalIdx);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleQuestionCollapse(originalIdx);
                    }}
                  >
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {!isCollapsed && (
              <CardContent className="space-y-4 pt-4">
                                 <div className={`grid gap-4 ${showHints ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                   <div>
                     <Label className="font-semibold text-sm">Текст вопроса</Label>
                     {isViewMode ? (
                       <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                         {q.text || 'Текст вопроса не указан'}
                       </div>
                     ) : (
                       <Textarea
                         value={q.text}
                         onChange={(e) => handleQuestionChange(originalIdx, 'text', e.target.value)}
                         placeholder="Введите текст вопроса"
                         required
                         rows={3}
                         className="mt-2 text-sm"
                       />
                     )}
                   </div>
                   {showHints && (
                     <div>
                       <Label className="font-semibold text-sm">Подсказка</Label>
                       {isViewMode ? (
                         <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                           {q.hint || 'Подсказка не указана'}
                         </div>
                       ) : (
                         <Textarea
                           value={q.hint || ''}
                           onChange={(e) => handleQuestionChange(originalIdx, 'hint', e.target.value)}
                           placeholder="Введите подсказку для студента"
                           rows={3}
                           className="mt-2 text-sm"
                         />
                       )}
                     </div>
                   )}
                 </div>
                
                {!isViewMode && (
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label className="font-semibold text-sm">Тип вопроса</Label>
                      <Select
                        value={q.question_type}
                        onValueChange={(value) => handleQuestionChange(originalIdx, 'question_type', value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single_choice">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full border-2 border-gray-400"></div>
                              Одиночный выбор
                            </div>
                          </SelectItem>
                          <SelectItem value="multiple_choice">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded border border-gray-400"></div>
                              Множественный выбор
                            </div>
                          </SelectItem>
                          <SelectItem value="open_text">
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3" />
                              Открытый текст
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {q.question_type === 'open_text' ? (
                      <div>
                        <Label className="font-semibold text-sm">Правильный ответ</Label>
                        <Input
                          value={q.correct_answer as string}
                          onChange={(e) => handleCorrectAnswerChange(originalIdx, e.target.value)}
                          placeholder="Введите правильный ответ"
                          required
                          className="mt-2"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-semibold text-sm">Варианты ответов</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addAnswer(originalIdx)}
                            className="flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Добавить
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {q.options?.map((option, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-3 p-3 rounded-lg" 
                                 style={{
                                   backgroundColor: q.correct_answer === oIdx || 
                                                   (Array.isArray(q.correct_answer) && q.correct_answer.includes(oIdx))
                                     ? '#dcfce7' // зеленый фон для правильного
                                     : '#fef2f2' // красный фон для неправильного
                                 }}>
                              <div className="flex items-center gap-2 flex-1">
                                {q.question_type === 'single_choice' ? (
                                  <input
                                    type="radio"
                                    name={`correct-${originalIdx}`}
                                    checked={q.correct_answer === oIdx}
                                    onChange={() => handleCorrectAnswerChange(originalIdx, oIdx)}
                                    className="h-4 w-4 text-blue-600"
                                  />
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={Array.isArray(q.correct_answer) && q.correct_answer.includes(oIdx)}
                                    onChange={(e) => {
                                      const currentAnswers = Array.isArray(q.correct_answer) ? q.correct_answer : [];
                                      if (e.target.checked) {
                                        handleCorrectAnswerChange(originalIdx, [...currentAnswers, oIdx]);
                                      } else {
                                        handleCorrectAnswerChange(originalIdx, currentAnswers.filter(idx => idx !== oIdx));
                                      }
                                    }}
                                    className="h-4 w-4 text-blue-600"
                                  />
                                )}
                                
                                <Input
                                  value={option}
                                  onChange={(e) => handleOptionChange(originalIdx, oIdx, e.target.value)}
                                  placeholder={`Вариант ${oIdx + 1}`}
                                  required
                                  className="flex-1"
                                />
                              </div>

                              {q.options && q.options.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAnswer(originalIdx, oIdx)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {!isViewMode && (
        <Button
          type="button"
          variant="outline"
          onClick={addQuestion}
          className="w-full py-8 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <Plus className="h-6 w-6 mr-2" />
          Добавить новый вопрос
        </Button>
      )}
    </div>
  );
};

export default QuestionEditor;
