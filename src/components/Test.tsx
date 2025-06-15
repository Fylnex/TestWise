import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface TestProps {
  testType: "hints" | "final";
  onComplete: () => void;
}

const questions: Question[] = [
  {
    id: 1,
    question: "Что такое ГТД?",
    options: [
      "Газотурбинный двигатель",
      "Гидротурбинный двигатель",
      "Газотурбинный дизель",
      "Газотурбинный движитель"
    ],
    correctAnswer: 0
  },
  {
    id: 2,
    question: "Какой цикл используется в ГТД?",
    options: [
      "Цикл Карно",
      "Цикл Брайтона",
      "Цикл Отто",
      "Цикл Дизеля"
    ],
    correctAnswer: 1
  },
  {
    id: 3,
    question: "Какой элемент ГТД отвечает за сжатие воздуха?",
    options: [
      "Турбина",
      "Компрессор",
      "Камера сгорания",
      "Сопло"
    ],
    correctAnswer: 1
  }
];

const Test = ({ testType, onComplete }: TestProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showHints, setShowHints] = useState(false);

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    return answers.reduce((score, answer, index) => {
      return score + (answer === questions[index].correctAnswer ? 1 : 0);
    }, 0);
  };

  const handleComplete = () => {
    onComplete();
  };

  if (showResults) {
    const score = calculateScore();
    const isPassed = score >= questions.length * 0.7; // 70% для прохождения

    return (
      <Card className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Результаты теста</h2>
          <p className="text-lg mb-4">
            Правильных ответов: {score} из {questions.length}
          </p>
          {isPassed ? (
            <div className="text-green-600 mb-4">
              <CheckCircle className="w-12 h-12 mx-auto mb-2" />
              <p className="text-xl font-semibold">Тест пройден!</p>
            </div>
          ) : (
            <div className="text-red-600 mb-4">
              <XCircle className="w-12 h-12 mx-auto mb-2" />
              <p className="text-xl font-semibold">Тест не пройден</p>
            </div>
          )}
          <Button onClick={handleComplete} className="mt-4">
            Завершить
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">
          Вопрос {currentQuestion + 1} из {questions.length}
        </h2>
        <p className="text-lg">{questions[currentQuestion].question}</p>
      </div>

      <RadioGroup
        value={answers[currentQuestion]?.toString()}
        onValueChange={(value) => handleAnswer(parseInt(value))}
        className="space-y-3"
      >
        {questions[currentQuestion].options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <RadioGroupItem value={index.toString()} id={`option-${index}`} />
            <Label htmlFor={`option-${index}`}>{option}</Label>
          </div>
        ))}
      </RadioGroup>

      {testType === "hints" && (
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setShowHints(!showHints)}
        >
          {showHints ? "Скрыть подсказку" : "Показать подсказку"}
        </Button>
      )}

      {showHints && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-md">
          <p className="text-sm text-yellow-800">
            Подсказка: {questions[currentQuestion].correctAnswer === 0 ? "Правильный ответ - первый вариант" : 
            questions[currentQuestion].correctAnswer === 1 ? "Правильный ответ - второй вариант" :
            questions[currentQuestion].correctAnswer === 2 ? "Правильный ответ - третий вариант" :
            "Правильный ответ - четвертый вариант"}
          </p>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          Назад
        </Button>
        <Button onClick={handleNext}>
          {currentQuestion === questions.length - 1 ? "Завершить" : "Далее"}
        </Button>
      </div>
    </Card>
  );
};

export default Test; 