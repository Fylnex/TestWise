import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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

interface UseTestProps {
  testId: number;
  topicId?: string;
  sectionId?: string;
}

interface UseTestReturn {
  // Состояние
  test: Test | null;
  questions: Question[];
  currentQuestion: number;
  answers: Record<number, number | number[] | string>;
  showResults: boolean;
  showHints: boolean;
  loading: boolean;
  error: string | null;
  timeLeft: number | null;
  testStarted: boolean;
  attemptId: number | null;
  startTime: Date | null;
  submitResponse: SubmitResponse | null;
  submitAttempts: number;
  statusCheckAttempts: number;
  redirectCountdown: number | null;

  // Методы
  handleStartTest: () => Promise<void>;
  handleAnswer: (questionId: number, value: number | number[] | string) => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleSubmitTest: () => Promise<void>;
  handleAutoSubmit: () => Promise<void>;
  checkAttemptStatus: () => Promise<boolean>;
  clearLocalStorage: () => void;
  clearAllTimers: () => void;
  formatTime: (seconds: number) => string;
  isAnswerReady: (
    answer: {
      questionId: number;
      selectedAnswer: number | number[] | string;
    },
    question: Question,
  ) => boolean;
  resetTest: () => void;
}

export const useTest = ({ testId, topicId, sectionId }: UseTestProps): UseTestReturn => {
  const navigate = useNavigate();
  const { user } = useAuth();

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

    // Проверяем роль пользователя - только студенты могут проходить тесты
    if (user?.role !== 'student') {
      setError("Доступ запрещен. Только студенты могут проходить тесты.");
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
        let allTests = [];
        
        // Пытаемся загрузить тест разными способами
        if (sectionId) {
          try {
            allTests = await testApi.getTestsBySection(Number(sectionId));
            console.log(`Found ${allTests.length} tests for section ${sectionId}`);
          } catch (error) {
            console.error("Error fetching tests by section:", error);
          }
        }
        
        if (allTests.length === 0 && topicId) {
          try {
            allTests = await testApi.getTestsByTopic(Number(topicId));
            console.log(`Found ${allTests.length} tests for topic ${topicId}`);
          } catch (error) {
            console.error("Error fetching tests by topic:", error);
          }
        }
        

        
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
           
           // Вычисляем оставшееся время на основе времени начала и длительности теста
           if (testData.duration && attemptStatus.start_time) {
             const startTime = new Date(attemptStatus.start_time);
             const now = new Date();
             const elapsed = (now.getTime() - startTime.getTime()) / 1000; // в секундах
             const totalTime = testData.duration * 60; // в секундах
             const remaining = Math.max(0, totalTime - elapsed);
             setTimeLeft(remaining);
           }
           
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
    // Проверяем роль пользователя - только студенты могут отправлять тесты
    if (user?.role !== 'student') {
      console.log("Non-student user, skipping auto submit");
      return;
    }

    if (!attemptId) {
      setError("Тест не был запущен");
      return;
    }

    if (submitAttempts >= 3) {
      if (topicId) {
        navigate(`/section/tree/${topicId}`);
      } else {
        navigate('/topics');
      }
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

  const checkAttemptStatus = async () => {
    if (!attemptId) {
      return false;
    }

    // Проверяем роль пользователя - только студенты могут проверять статус
    if (user?.role !== 'student') {
      console.log("Non-student user, skipping status check");
      return false;
    }

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
        return true;
      }
    } catch (error: any) {
      console.error("Error checking attempt status:", error);
      // Не устанавливаем ошибку, просто возвращаем false
      return false;
    }
    return false;
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
          // Прямо отправляем ответы без проверки статуса (избегаем 404 при истечении времени)
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
        if (topicId) {
          navigate(`/section/tree/${topicId}`);
        } else {
          navigate('/topics');
        }
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
    // Проверяем роль пользователя - только студенты могут запускать тесты
    if (user?.role !== 'student') {
      setError("Доступ запрещен. Только студенты могут запускать тесты.");
      return;
    }

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
    // Проверяем роль пользователя - только студенты могут отправлять тесты
    if (user?.role !== 'student') {
      console.log("Non-student user, skipping test submission");
      return;
    }

    // Останавливаем таймер при ручной отправке
    clearAllTimers();
    
    // Проверяем статус попытки перед отправкой
    const isCompleted = await checkAttemptStatus();
    if (isCompleted) {
      return; // Попытка уже завершена, показываем результаты
    }
    
    await handleAutoSubmit();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const resetTest = () => {
    clearAllTimers();
    clearLocalStorage();
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
  };

  return {
    // Состояние
    test,
    questions,
    currentQuestion,
    answers,
    showResults,
    showHints,
    loading,
    error,
    timeLeft,
    testStarted,
    attemptId,
    startTime,
    submitResponse,
    submitAttempts,
    statusCheckAttempts,
    redirectCountdown,

    // Методы
    handleStartTest,
    handleAnswer,
    handleNext,
    handlePrevious,
    handleSubmitTest,
    handleAutoSubmit,
    checkAttemptStatus,
    clearLocalStorage,
    clearAllTimers,
    formatTime,
    isAnswerReady,
    resetTest,
  };
};
