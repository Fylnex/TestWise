import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, ArrowLeft, Clock, HelpCircle } from 'lucide-react';
import { testApi, Test } from '@/services/testApi';
import { questionApi, Question } from '@/services/questionApi';

interface TestViewerProps {
  testId?: number;
}

interface Answer {
  questionId: number;
  selectedAnswer: number;
}

const TestViewer: React.FC<TestViewerProps> = ({ testId: propTestId }) => {
  const { testId: urlTestId } = useParams();
  const navigate = useNavigate();
  const testId = propTestId || Number(urlTestId);

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!testId) return;
    
    const loadTest = async () => {
      try {
        setLoading(true);
        const [testData, questionsData] = await Promise.all([
          testApi.getTest(testId),
          questionApi.getQuestionsByTestId(testId)
        ]);
        
        setTest(testData);
        setQuestions(questionsData);
        
        // Инициализируем ответы
        setAnswers(questionsData.map(q => ({ questionId: q.id, selectedAnswer: -1 })));
        
        // Если есть ограничение по времени, устанавливаем таймер
        if (testData.duration) {
          setTimeLeft(testData.duration * 60); // конвертируем минуты в секунды
        }
      } catch (err) {
        setError('Ошибка загрузки теста');
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId]);

  // Таймер для ограничения времени
  useEffect(() => {
    if (!testStarted || !timeLeft || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          // Auto-submit when time runs out
          const submitTest = async () => {
            try {
              if (!attemptId) {
                setError('Тест не был запущен');
                return;
              }

              const timeSpent = startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0;
              
              const results = {
                attempt_id: attemptId,
                answers: answers.map(answer => ({
                  question_id: answer.questionId,
                  answer: answer.selectedAnswer
                })),
                time_spent: timeSpent
              };

              await testApi.submitTest(testId, results);
              setShowResults(true);
            } catch (err) {
              setError('Ошибка отправки результатов');
            }
          };
          submitTest();
          return 0;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, timeLeft, attemptId, startTime, answers, testId]);

  const handleAnswer = (answerIndex: number) => {
    setAnswers(prev => 
      prev.map((answer, index) => 
        index === currentQuestion 
          ? { ...answer, selectedAnswer: answerIndex }
          : answer
      )
    );
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Submit test when reaching the last question
      handleSubmitTest();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleStartTest = async () => {
    try {
      const startResponse = await testApi.startTest(testId);
      setAttemptId(startResponse.attempt_id);
      setStartTime(new Date());
      setTestStarted(true);
    } catch (err) {
      setError('Ошибка запуска теста');
    }
  };

  const handleSubmitTest = async () => {
    try {
      if (!attemptId) {
        setError('Тест не был запущен');
        return;
      }

      const timeSpent = startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0;
      
      const results = {
        attempt_id: attemptId,
        answers: answers.map(answer => ({
          question_id: answer.questionId,
          answer: answer.selectedAnswer
        })),
        time_spent: timeSpent
      };

      await testApi.submitTest(testId, results);
      setShowResults(true);
    } catch (err) {
      setError('Ошибка отправки результатов');
    }
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      const userAnswer = answers[index]?.selectedAnswer;
      if (userAnswer !== -1 && question.correct_answer === userAnswer) {
        correctAnswers++;
      }
    });
    return Math.round((correctAnswers / questions.length) * 100);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">Загрузка теста...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center text-red-500">{error}</div>
        <Button onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
      </div>
    );
  }

  if (!test || !questions.length) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">Тест не найден</div>
        <Button onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
      </div>
    );
  }

  // Экран начала теста
  if (!testStarted) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{test.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Информация о тесте:</h3>
                <ul className="space-y-2 text-sm">
                  <li>Тип: {test.type}</li>
                  <li>Количество вопросов: {questions.length}</li>
                  {test.duration && (
                    <li>Время: {test.duration} минут</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Инструкции:</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Внимательно читайте каждый вопрос</li>
                  <li>• Выберите один правильный ответ</li>
                  {test.type === 'hinted' && (
                    <li>• Используйте подсказки при необходимости</li>
                  )}
                  {test.duration && (
                    <li>• Следите за временем</li>
                  )}
                </ul>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <Button onClick={handleStartTest} className="flex-1">
                Начать тест
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Экран результатов
  if (showResults) {
    const score = calculateScore();
    const isPassed = score >= 70; // 70% для прохождения

    return (
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Результаты теста</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-4xl font-bold">
              {score}%
            </div>
            
            {isPassed ? (
              <div className="text-green-600">
                <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                <p className="text-xl font-semibold">Тест пройден!</p>
              </div>
            ) : (
              <div className="text-red-600">
                <XCircle className="w-16 h-16 mx-auto mb-4" />
                <p className="text-xl font-semibold">Тест не пройден</p>
              </div>
            )}

            <div className="text-sm text-gray-600">
              Правильных ответов: {answers.filter((answer, index) => 
                answer.selectedAnswer !== -1 && 
                questions[index].correct_answer === answer.selectedAnswer
              ).length} из {questions.length}
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setCurrentQuestion(0);
                  setAnswers(questions.map(q => ({ questionId: q.id, selectedAnswer: -1 })));
                  setShowResults(false);
                  setTestStarted(false);
                  setAttemptId(null);
                  setStartTime(null);
                  if (test.duration) {
                    setTimeLeft(test.duration * 60);
                  }
                }}
              >
                Пройти заново
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Экран прохождения теста
  const currentQ = questions[currentQuestion];
  const currentAnswer = answers[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">
              Вопрос {currentQuestion + 1} из {questions.length}
            </CardTitle>
            {timeLeft && (
              <div className="flex items-center gap-2 text-red-600">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">{currentQ.question}</h3>
            
            <RadioGroup
              value={currentAnswer?.selectedAnswer?.toString() || ""}
              onValueChange={(value) => handleAnswer(parseInt(value))}
              className="space-y-3"
            >
              {currentQ.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="text-base">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {test.type === 'hinted' && currentQ.hint && (
            <div>
              <Button
                variant="outline"
                onClick={() => setShowHints(!showHints)}
                className="flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                {showHints ? "Скрыть подсказку" : "Показать подсказку"}
              </Button>
              
              {showHints && (
                <div className="mt-3 p-4 bg-yellow-50 rounded-md border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Подсказка:</strong> {currentQ.hint}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Назад
            </Button>
            
            <div className="flex gap-2">
              {currentQuestion === questions.length - 1 ? (
                <Button 
                  onClick={handleSubmitTest}
                  disabled={currentAnswer?.selectedAnswer === -1}
                >
                  Завершить тест
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  disabled={currentAnswer?.selectedAnswer === -1}
                >
                  Следующий
                </Button>
              )}
            </div>
          </div>

          {/* Прогресс-бар */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestViewer;