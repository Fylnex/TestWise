import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  Clock,
  HelpCircle,
  Play,
  BookOpen,
  Target,
  Timer,
  Users,
} from "lucide-react";
import { Question } from "@/services/testApi";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import { useTest } from "@/hooks/useTest";
import { getTestTypeInRussian } from "@/lib/utils";

interface TestViewerProps {
  testId?: number;
}

const TestViewer: React.FC<TestViewerProps> = ({ testId: propTestId }) => {
  const { testId: urlTestId, topicId, sectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const testId = propTestId || Number(urlTestId);

  const [showHints, setShowHints] = useState(false);

  // Используем хук для управления тестом
  const {
    test,
    questions,
    currentQuestion,
    answers,
    showResults,
    loading,
    error,
    timeLeft,
    testStarted,
    submitResponse,
    redirectCountdown,
    handleStartTest,
    handleAnswer,
    handleNext,
    handlePrevious,
    handleSubmitTest,
    clearAllTimers,
    formatTime,
    isAnswerReady,
    resetTest,
  } = useTest({ testId, topicId, sectionId });

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-center">Загрузка теста...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-center text-red-500">{error}</div>
          <Button onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-center">Тест не найден</div>
          <Button onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Готовы к тестированию?</h1>
            <p className="text-gray-600">Проверьте свои знания и получите результат</p>
          </div>
          
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">{test.title}</CardTitle>
              {test.description && (
                <p className="text-gray-600 mt-2">{test.description}</p>
              )}
              <div className="flex justify-center mt-4">
                <Badge variant="secondary" className="text-sm">
                  {getTestTypeInRussian(test.type)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Информация о тесте */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {test.duration && (
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                    <Timer className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{test.duration} мин</p>
                      <p className="text-sm text-gray-600">Время на прохождение</p>
                    </div>
                  </div>
                )}
                
                {test.max_attempts && (
                  <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                    <Users className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{test.max_attempts}</p>
                      <p className="text-sm text-gray-600">Попыток доступно</p>
                    </div>
                  </div>
                )}
                
                {test.questions && (
                  <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                    <Target className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{test.questions.length}</p>
                      <p className="text-sm text-gray-600">Вопросов в тесте</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Инструкции */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2 text-gray-600" />
                  Инструкции по прохождению
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      Внимательно читайте каждый вопрос
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      Выберите правильные ответы
                    </li>
                  </ul>
                  <ul className="space-y-2">
                    {test.type === "hinted" && (
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        Используйте подсказки при необходимости
                      </li>
                    )}
                    {test.duration && (
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        Следите за временем
                      </li>
                    )}
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      Можно вернуться к предыдущим вопросам
                    </li>
                  </ul>
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  onClick={handleStartTest} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Начать тест
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  className="py-3 text-lg"
                  size="lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Назад
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showResults && submitResponse) {
    const isPassed = submitResponse.score >= 70;

    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Результаты теста
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="text-4xl font-bold">{submitResponse.score}%</div>
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
                Правильных ответов: {submitResponse.correctCount || 0} из{" "}
                {submitResponse.totalQuestions || 0}
              </div>

              {/* Счетчик автоматического перенаправления */}
              {redirectCountdown !== null && redirectCountdown > 0 && (
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                  Автоматическое перенаправление через {redirectCountdown}{" "}
                  секунд...
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => {
                    clearAllTimers();
                    navigate(-1);
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Назад
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetTest();
                  }}
                >
                  Пройти заново
                </Button>

              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const currentAnswer = answers[currentQ.id];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">
                Вопрос {currentQuestion + 1} из {questions.length}
              </CardTitle>
              {timeLeft !== null && (
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

              {currentQ.image && (
                <div className="mb-4">
                  <img
                    src={currentQ.image}
                    alt="Question image"
                    className="max-w-full h-auto rounded-md border"
                  />
                </div>
              )}

              {currentQ.question_type === "single_choice" ? (
                <RadioGroup
                  value={
                    typeof currentAnswer === "number"
                      ? currentAnswer.toString()
                      : ""
                  }
                  onValueChange={(value) =>
                    handleAnswer(currentQ.id, parseInt(value))
                  }
                  className="space-y-3"
                >
                  {currentQ.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={index.toString()}
                        id={`option-${index}`}
                      />
                      <Label htmlFor={`option-${index}`} className="text-base">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : currentQ.question_type === "multiple_choice" ? (
                <div className="space-y-3">
                  {currentQ.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`checkbox-${index}`}
                        checked={
                          Array.isArray(currentAnswer) &&
                          currentAnswer.includes(index)
                        }
                        onChange={() => {
                          const currentAnswers = Array.isArray(currentAnswer)
                            ? currentAnswer
                            : [];
                          handleAnswer(
                            currentQ.id,
                            currentAnswers.includes(index)
                              ? currentAnswers.filter((a) => a !== index)
                              : [...currentAnswers, index],
                          );
                        }}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      />
                      <Label
                        htmlFor={`checkbox-${index}`}
                        className="text-base cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <Textarea
                    value={
                      typeof currentAnswer === "string" ? currentAnswer : ""
                    }
                    onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                    placeholder="Введите ваш ответ"
                    className="w-full"
                    rows={4}
                  />
                </div>
              )}
            </div>

            {test.type === "hinted" && currentQ.hint && (
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
                    disabled={
                      !currentAnswer ||
                      !isAnswerReady(
                        {
                          questionId: currentQ.id,
                          selectedAnswer: currentAnswer,
                        },
                        currentQ,
                      )
                    }
                  >
                    Завершить тест
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={
                      !currentAnswer ||
                      !isAnswerReady(
                        {
                          questionId: currentQ.id,
                          selectedAnswer: currentAnswer,
                        },
                        currentQ,
                      )
                    }
                  >
                    Следующий
                  </Button>
                )}
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestViewer;
