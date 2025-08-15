import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  Clock,
  HelpCircle,
} from "lucide-react";
import {
  testApi,
  Test,
  TestStartResponse,
  SubmitTestData,
  SubmitResponse,
  AttemptStatusResponse,
  Question,
} from "@/services/testApi";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";

interface TestViewerProps {
  testId?: number;
}

const TestViewer: React.FC<TestViewerProps> = ({ testId: propTestId }) => {
  const { testId: urlTestId, topicId, sectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const testId = propTestId || Number(urlTestId);

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<
    Record<number, number | number[] | string>
  >({});
  const [showResults, setShowResults] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [submitResponse, setSubmitResponse] = useState<SubmitResponse | null>(
    null,
  );
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [statusCheckAttempts, setStatusCheckAttempts] = useState(0);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(
    null,
  );

  // Refs для контроля таймеров
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Восстановление состояния из localStorage и проверка активной попытки
  useEffect(() => {
    if (!testId) {
      console.error("testId is undefined or invalid");
      setError("Неверный ID теста");
      setLoading(false);
      return;
    }

    console.log(
      `Loading test data for testId: ${testId}, sectionId: ${sectionId}, topicId: ${topicId}`,
    );

    const loadTestData = async () => {
      try {
        setLoading(true);

        // Загружаем базовую информацию о тесте (без вопросов)
        console.log("Fetching tests by section or topic...");
        const allTests =
          (await testApi.getTestsBySection(Number(sectionId) || undefined)) ||
          (await testApi.getTestsByTopic(Number(topicId) || undefined)) ||
          [];
        const testData = allTests.find((t) => t.id === testId);
        if (!testData) {
          throw new Error("Тест не найден");
        }
        setTest(testData);

        console.log("Fetching attempt status...");
        try {
          // Проверяем статус попытки через /tests/{test_id}/status
          const attemptStatus = await testApi.getTestAttemptStatus(testId);
          console.log("Attempt status received:", attemptStatus);
          setAttemptId(attemptStatus.attempt_id);
          setStartTime(new Date(attemptStatus.start_time));
          setQuestions(attemptStatus.questions);
          setAnswers(
            attemptStatus.questions.reduce(
              (acc, q) => ({
                ...acc,
                [q.id]:
                  q.question_type === "multiple_choice"
                    ? []
                    : q.question_type === "open_text"
                      ? ""
                      : null,
              }),
              {} as Record<number, number | number[] | string>,
            ),
          );
          setCurrentQuestion(0);
          setTestStarted(true);
          localStorage.setItem(
            `test_${testId}_attemptId`,
            attemptStatus.attempt_id.toString(),
          );
        } catch (error: any) {
          console.error("Error fetching attempt status:", error);
          if (
            error.response?.status === 404 ||
            error.response?.status === 304
          ) {
            // Нет активной попытки или кэшированный ответ, инициализируем пустое состояние
            setQuestions([]);
            setAnswers({});
            setCurrentQuestion(0);
            setTestStarted(false);
          } else {
            setError("Ошибка загрузки статуса попытки");
            console.error("Error fetching attempt status:", error);
          }
        }
      } catch (err) {
        setError("Ошибка загрузки теста");
        console.error("Error loading test:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTestData();
  }, [testId, sectionId, topicId]);

  // Сохранение состояния в localStorage при изменении
  useEffect(() => {
    if (testId && testStarted && attemptId) {
      localStorage.setItem(`test_${testId}_attemptId`, attemptId.toString());
      localStorage.setItem(`test_${testId}_test`, JSON.stringify(test));
      localStorage.setItem(
        `test_${testId}_questions`,
        JSON.stringify(questions),
      );
      localStorage.setItem(`test_${testId}_answers`, JSON.stringify(answers));
      localStorage.setItem(
        `test_${testId}_currentQuestion`,
        currentQuestion.toString(),
      );
      localStorage.setItem(
        `test_${testId}_startTime`,
        startTime?.toISOString() || "",
      );
    }
  }, [
    testId,
    testStarted,
    attemptId,
    test,
    questions,
    answers,
    currentQuestion,
    startTime,
  ]);

  // Очистка localStorage
  const clearLocalStorage = () => {
    localStorage.removeItem(`test_${testId}_attemptId`);
    localStorage.removeItem(`test_${testId}_test`);
    localStorage.removeItem(`test_${testId}_questions`);
    localStorage.removeItem(`test_${testId}_answers`);
    localStorage.removeItem(`test_${testId}_currentQuestion`);
    localStorage.removeItem(`test_${testId}_startTime`);
  };

  // Очистка всех таймеров
  const clearAllTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  const handleAutoSubmit = async () => {
    if (!attemptId) {
      setError("Тест не был запущен");
      return;
    }

    // Проверяем статус попытки
    try {
      const attemptStatus = await testApi.getTestAttemptStatus(testId);
      if (attemptStatus.status === "COMPLETED") {
        console.log("Attempt already completed:", attemptStatus);
        setSubmitResponse({
          id: attemptStatus.attempt_id,
          user_id: user?.id || 0,
          test_id: testId,
          attempt_number: attemptStatus.attempt_number,
          score: attemptStatus.score || 0,
          time_spent: attemptStatus.duration || 0,
          started_at: attemptStatus.start_time,
          completed_at: attemptStatus.completed_at || null,
          status: attemptStatus.status,
          correctCount: attemptStatus.score
            ? Math.round(
                (attemptStatus.score / 100) * attemptStatus.questions.length,
              )
            : 0,
          totalQuestions: attemptStatus.questions.length,
        });
        setShowResults(true);
        clearLocalStorage();
        return;
      }
    } catch (error: any) {
      console.error("Error checking attempt status:", error);
      setError("Ошибка проверки статуса попытки");
      return;
    }

    if (submitAttempts >= 3) {
      navigate(`/section/tree/${topicId}`);
      return;
    }

    // Отправляем ВСЕ ответы, включая неподтвержденные
    const submitData: SubmitTestData = {
      attempt_id: attemptId,
      time_spent: Math.floor((Date.now() - startTime!.getTime()) / 1000),
      answers: Object.entries(answers).map(([questionId, selectedAnswer]) => {
        const question = questions.find((q) => q.id === Number(questionId))!;
        return {
          question_id: Number(questionId),
          answer:
            question.question_type === "open_text"
              ? typeof selectedAnswer === "string"
                ? selectedAnswer
                : ""
              : Array.isArray(selectedAnswer)
                ? selectedAnswer
                : selectedAnswer !== null
                  ? [selectedAnswer as number]
                  : [], // Отправляем пустой массив для неотвеченных вопросов
        };
      }),
    };

    try {
      const response = await testApi.submitTest(testId, submitData);
      console.log("Submit response:", response);
      setSubmitResponse(response);
      setShowResults(true);
      clearLocalStorage();
    } catch (err) {
      setError("Ошибка отправки результатов");
      console.error("Error submitting test:", err);
      setSubmitAttempts((prev) => prev + 1);
      if (submitAttempts + 1 >= 3) {
        navigate(`/section/tree/${topicId}`);
      }
    }
  };

  // Таймер для теста
  useEffect(() => {
    // Очищаем предыдущий таймер
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (
      testStarted &&
      startTime &&
      test?.duration &&
      attemptId &&
      !showResults
    ) {
      const calculateTimeLeft = async () => {
        const now = new Date();
        const elapsed = (now.getTime() - startTime.getTime()) / 1000; // В секундах
        const totalTime = test.duration * 60; // В секундах
        const remaining = Math.max(0, totalTime - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          // Прямо отправляем ответы без проверки статуса
          await handleAutoSubmit();

          // Останавливаем таймер после обработки истечения времени
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      };

      calculateTimeLeft();
      timerRef.current = setInterval(calculateTimeLeft, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    testStarted,
    startTime,
    test?.duration,
    attemptId,
    testId,
    user,
    showResults,
  ]);

  // Автоматическое перенаправление через 30 секунд после показа результатов
  useEffect(() => {
    if (showResults && topicId) {
      // Запускаем обратный отсчет
      setRedirectCountdown(30);

      // Таймер для обновления счетчика каждую секунду
      countdownTimerRef.current = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev === null || prev <= 1) {
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      // Таймер для перенаправления через 30 секунд
      redirectTimerRef.current = setTimeout(() => {
        navigate(`/section/tree/${topicId}`);
      }, 30000);
    }

    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [showResults, topicId, navigate]);

  // Очистка всех таймеров при размонтировании компонента
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const handleStartTest = async () => {
    try {
      setLoading(true);
      setError(null);

      // Проверяем наличие активной попытки через /tests/{test_id}/status
      try {
        const attemptStatus = await testApi.getTestAttemptStatus(testId);
        if (attemptStatus.status === "IN_PROGRESS") {
          setError(
            "У вас уже есть активная попытка. Завершите её перед началом новой.",
          );
          return;
        }
      } catch (error: any) {
        if (error.response?.status !== 404) {
          setError("Ошибка проверки статуса попытки");
          console.error("Error checking attempt status:", error);
          return;
        }
      }

      // Начинаем новую попытку
      const startResponse = await testApi.startTest(testId);
      setAttemptId(startResponse.attempt_id);
      setStartTime(new Date(startResponse.start_time));
      setQuestions(startResponse.questions);
      setAnswers(
        startResponse.questions.reduce(
          (acc, q) => ({
            ...acc,
            [q.id]:
              q.question_type === "multiple_choice"
                ? []
                : q.question_type === "open_text"
                  ? ""
                  : null,
          }),
          {} as Record<number, number | number[] | string>,
        ),
      );
      setCurrentQuestion(0);
      setTestStarted(true);
      if (test?.duration) {
        setTimeLeft(test.duration * 60);
      }
      localStorage.setItem(
        `test_${testId}_attemptId`,
        startResponse.attempt_id.toString(),
      );
    } catch (err) {
      setError("Ошибка запуска теста");
      console.error("Error starting test:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (
    questionId: number,
    value: number | number[] | string,
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmitTest();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const isAnswerReady = (
    answer: {
      questionId: number;
      selectedAnswer: number | number[] | string;
    },
    question: Question,
  ) => {
    if (question.question_type === "single_choice") {
      return typeof answer.selectedAnswer === "number";
    }
    if (question.question_type === "multiple_choice") {
      return (
        Array.isArray(answer.selectedAnswer) && answer.selectedAnswer.length > 0
      );
    }
    if (question.question_type === "open_text") {
      return (
        typeof answer.selectedAnswer === "string" &&
        answer.selectedAnswer.trim() !== ""
      );
    }
    return false;
  };

  const handleSubmitTest = async () => {
    // Останавливаем таймер при ручной отправке
    clearAllTimers();
    await handleAutoSubmit();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

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
      <div className="min-h-screen bg-white">
        <Header />
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
                    {test.duration && <li>Время: {test.duration} минут</li>}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Инструкции:</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Внимательно читайте каждый вопрос</li>
                    <li>• Выберите правильные ответы</li>
                    {test.type === "hinted" && (
                      <li>• Используйте подсказки при необходимости</li>
                    )}
                    {test.duration && <li>• Следите за временем</li>}
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
                    clearAllTimers();
                    setCurrentQuestion(0);
                    setAnswers({});
                    setShowResults(false);
                    setTestStarted(false);
                    setAttemptId(null);
                    setStartTime(null);
                    setSubmitResponse(null);
                    setTimeLeft(null);
                    setSubmitAttempts(0);
                    setStatusCheckAttempts(0);
                    setRedirectCountdown(null);
                    clearLocalStorage();
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
