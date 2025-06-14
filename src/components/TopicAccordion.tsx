import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  CheckCircle,
  Lock,
  Play,
  HelpCircle,
  Target,
} from "lucide-react";
import { useState } from "react";

interface TopicSection {
  id: string;
  title: string;
  content: string;
  completed?: boolean;
  isTest?: boolean;
  testType?: "hints" | "final";
}

interface Topic {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  isMainTopic?: boolean;
  hintsTestCompleted: boolean;
  finalTestCompleted: boolean;
  children?: TopicSection[];
}

const topicData: Topic[] = [
  {
    id: "introduction",
    title: "Введение в газотурбинные двигатели",
    content: "Основополагающий курс по принципам работы и конструкции ГТД.",
    completed: false,
    hintsTestCompleted: false,
    finalTestCompleted: false,
    isMainTopic: false,
    children: [
      {
        id: "history",
        title: "История развития ГТД",
        content:
          "Эволюция газотурбинных технологий от первых образцов до современных двигателей.",
        completed: false,
      },
      {
        id: "classification",
        title: "Классификация и типы ГТД",
        content: "Различные типы газотурбинных двигателей и их применение.",
        completed: false,
      },
      {
        id: "basic-principles",
        title: "Основные принципы работы",
        content: "Цикл Брайтона и принципы преобразования энергии в ГТД.",
        completed: false,
      },
      {
        id: "introduction-hints-test",
        title: "Тест с подсказками - Введение",
        content: "Тренировочный тест с подсказками по основам ГТД.",
        completed: false,
        isTest: true,
        testType: "hints",
      },
      {
        id: "introduction-final-test",
        title: "Итоговый тест - Введение",
        content:
          "Финальная проверка знаний по основам газотурбинных двигателей.",
        completed: false,
        isTest: true,
        testType: "final",
      },
    ],
  },
  {
    id: "thermodynamics",
    title: "Термодинамические основы ГТД",
    content: "Изучение термодинамических процессов в газотурбинных двигателях.",
    completed: false,
    hintsTestCompleted: false,
    finalTestCompleted: false,
    children: [
      {
        id: "brayton-cycle",
        title: "Цикл Брайтона",
        content: "Идеальный и действительный циклы, КПД цикла.",
        completed: false,
      },
      {
        id: "heat-transfer",
        title: "Теплообмен в ГТД",
        content: "Процессы теплопередачи в различных узлах двигателя.",
        completed: false,
      },
      {
        id: "gas-dynamics",
        title: "Газодинамика проточной части",
        content: "Течение газа через компрессор, камеру сгорания и турбину.",
        completed: false,
      },
      {
        id: "thermodynamics-hints-test",
        title: "Тест с подсказками - Термодинамика",
        content:
          "Тренировочный тест с подсказками по термодинамическим процессам.",
        completed: false,
        isTest: true,
        testType: "hints",
      },
      {
        id: "thermodynamics-final-test",
        title: "Итоговый тест - Термодинамика",
        content: "Финальный контроль знаний по термодинамическим процессам.",
        completed: false,
        isTest: true,
        testType: "final",
      },
    ],
  },
  {
    id: "compressors",
    title: "Компрессоры ГТД",
    content: "Конструкция, принципы работы и характеристики компрессоров.",
    completed: false,
    hintsTestCompleted: false,
    finalTestCompleted: false,
    children: [
      {
        id: "axial-compressors",
        title: "Осевые компрессоры",
        content: "Устройство и работа многоступенчатых осевых компрессоров.",
      },
      {
        id: "centrifugal-compressors",
        title: "Центробежные компрессоры",
        content:
          "Принципы работы и области применения центробежных компрессоров.",
      },
      {
        id: "compressor-characteristics",
        title: "Характеристики компрессоров",
        content:
          "Построение и анализ характеристик, помпаж, запас устойчивости.",
      },
      {
        id: "compressor-control",
        title: "Регулирование компрессоров",
        content: "Методы регулирования работы компрессора, поворотные лопатки.",
      },
      {
        id: "compressors-hints-test",
        title: "Тест с подсказками - Компрессоры",
        content: "Тренировочный тест с подсказками по компрессорам ГТД.",
        isTest: true,
        testType: "hints",
      },
      {
        id: "compressors-final-test",
        title: "Итоговый тест - Компрессоры",
        content: "Финальная проверка знаний по компрессорам ГТД.",
        isTest: true,
        testType: "final",
      },
    ],
  },
  {
    id: "combustion",
    title: "Камеры сгорания",
    content:
      "Процессы горения, конструкция и рабочие характеристики камер сгорания.",
    completed: false,
    hintsTestCompleted: false,
    finalTestCompleted: false,
    children: [
      {
        id: "combustion-theory",
        title: "Теория горения",
        content:
          "Физико-химические процессы горения топлива в камере сгорания.",
      },
      {
        id: "combustor-types",
        title: "Типы камер сгорания",
        content: "Кольцевые, трубчатые и трубчато-кольцевые камеры сгорания.",
      },
      {
        id: "fuel-systems",
        title: "Топливные системы",
        content: "Форсунки, распределение топлива, системы подачи.",
      },
      {
        id: "emission-control",
        title: "Экологические аспекты",
        content: "Снижение выбросов NOx, CO, несгоревших углеводородов.",
      },
      {
        id: "combustion-hints-test",
        title: "Тест с подсказками - Камеры сгорания",
        content: "Тренировочный тест с подсказками по камерам сгорания.",
        isTest: true,
        testType: "hints",
      },
      {
        id: "combustion-final-test",
        title: "Итоговый тест - Камеры сгорания",
        content: "Финальный контроль знаний по камерам сгорания.",
        isTest: true,
        testType: "final",
      },
    ],
  },
  {
    id: "turbines",
    title: "Турбины ГТД",
    content: "Конструкция и работа турбин высокого и низкого давления.",
    completed: false,
    hintsTestCompleted: false,
    finalTestCompleted: false,
    children: [
      {
        id: "turbine-theory",
        title: "Теория турбин",
        content: "Принципы работы осевых турбин, треугольники скоростей.",
      },
      {
        id: "cooling-systems",
        title: "Системы охлаждения",
        content: "Методы охлаждения лопаток и дисков турбины.",
      },
      {
        id: "turbine-materials",
        title: "Материалы турбин",
        content: "Жаропрочные сплавы, керамические покрытия.",
      },
      {
        id: "turbine-design",
        title: "Конструкция турбин",
        content: "Диски, лопатки, системы крепления и уплотнения.",
      },
      {
        id: "turbines-hints-test",
        title: "Тест с подсказками - Турбины",
        content: "Тренировочный тест с подсказками по турбинам ГТД.",
        isTest: true,
        testType: "hints",
      },
      {
        id: "turbines-final-test",
        title: "Итоговый тест - Турбины",
        content: "Финальная проверка знаний по турбинам ГТД.",
        isTest: true,
        testType: "final",
      },
    ],
  },
  {
    id: "control-systems",
    title: "Системы управления ГТД",
    content: "Автоматическое управление и регулирование работы двигателя.",
    completed: false,
    hintsTestCompleted: false,
    finalTestCompleted: false,
    children: [
      {
        id: "control-theory",
        title: "Теория управления",
        content:
          "Принципы автоматического регулирования газотурбинных двигателей.",
      },
      {
        id: "fadec-systems",
        title: "Системы FADEC",
        content:
          "Полнофункциональное цифровое электронное управление двигателем.",
      },
      {
        id: "sensors",
        title: "Датчики и измерения",
        content: "Контроль параметров работы двигателя, системы мониторинга.",
      },
      {
        id: "control-algorithms",
        title: "Алгоритмы управления",
        content: "Логика работы системы управления, режимы работы.",
      },
      {
        id: "control-hints-test",
        title: "Тест с подсказками - Системы управления",
        content: "Тренировочный тест с подсказками по системам управлени��.",
        isTest: true,
        testType: "hints",
      },
      {
        id: "control-final-test",
        title: "Итоговый тест - Системы управления",
        content: "Финальный контроль знаний по системам управления.",
        isTest: true,
        testType: "final",
      },
    ],
  },
  {
    id: "operation",
    title: "Эксплуатация и обслуживание ГТД",
    content: "Практические аспекты эксплуатации газотурбинных двигателей.",
    completed: false,
    hintsTestCompleted: false,
    finalTestCompleted: false,
    children: [
      {
        id: "operation-procedures",
        title: "Процедуры эксплуатации",
        content: "Запуск, работа на различных режимах, останов двигателя.",
      },
      {
        id: "maintenance",
        title: "Техническое обслуживание",
        content: "Планово-предупредительные работы, межремонтные периоды.",
      },
      {
        id: "performance-monitoring",
        title: "Мониторинг характеристик",
        content: "Отслеживание изменения параметров, trending анализ.",
      },
      {
        id: "safety-procedures",
        title: "Процедуры безопасности",
        content: "Требования безопасности при работе с ГТД.",
      },
      {
        id: "operation-hints-test",
        title: "Тест с подсказками - Эксплуатация",
        content: "Тренировочный тест с подсказками по эксплуатации ГТД.",
        isTest: true,
        testType: "hints",
      },
      {
        id: "operation-final-test",
        title: "Итоговый тест - Эксплуатация",
        content: "Финальная проверка знаний по эксплуатации ГТД.",
        isTest: true,
        testType: "final",
      },
    ],
  },
  {
    id: "diagnostics",
    title: "Диагностика и устранение неисправностей",
    content: "Методы диагностики состояния и поиск неисправностей ГТД.",
    completed: false,
    hintsTestCompleted: false,
    finalTestCompleted: false,
    children: [
      {
        id: "diagnostic-methods",
        title: "Методы диагностики",
        content: "Вибродиагностика, термография, эндоскопия.",
      },
      {
        id: "fault-analysis",
        title: "Анализ неисправностей",
        content: "Типичные неисправности и методы их выявления.",
      },
      {
        id: "repair-procedures",
        title: "Процедуры ремонта",
        content: "Технологии ремонта и восстановления узлов ГТД.",
      },
      {
        id: "predictive-maintenance",
        title: "Прогнозное обслуживание",
        content: "Системы прогнозирования технического состояния.",
      },
      {
        id: "diagnostics-hints-test",
        title: "Тест с подсказками - Диагностика",
        content: "Тренировочный тест с подсказками по диагностике ГТД.",
        isTest: true,
        testType: "hints",
      },
      {
        id: "diagnostics-final-test",
        title: "Итоговый тест - Диагностика",
        content: "Финальный контроль знаний по диагностике ГТД.",
        isTest: true,
        testType: "final",
      },
    ],
  },
  {
    id: "final-certification",
    title: "Итоговая аттестация",
    content: "Комплексная проверка знаний по всем разделам курса ГТД.",
    completed: false,
    hintsTestCompleted: false,
    finalTestCompleted: false,
    isMainTopic: true,
  },
];

const TopicAccordion = () => {
  const [topics, setTopics] = useState<Topic[]>(topicData);

  const handleCompleteTest = (
    topicId: string,
    testType: "hints" | "final",
    sectionId?: string,
  ) => {
    setTopics((prevTopics) => {
      const updatedTopics = prevTopics.map((topic) => {
        if (topic.id === topicId) {
          const updatedTopic = { ...topic };

          if (testType === "hints") {
            updatedTopic.hintsTestCompleted = true;
          } else if (testType === "final") {
            updatedTopic.finalTestCompleted = true;
          }

          // Проверяем, завершены ли оба теста
          if (
            updatedTopic.hintsTestCompleted &&
            updatedTopic.finalTestCompleted
          ) {
            updatedTopic.completed = true;
          }

          // Обновляем дочерние секции
          if (sectionId && topic.children) {
            updatedTopic.children = topic.children.map((child) =>
              child.id === sectionId ? { ...child, completed: true } : child,
            );
          }

          return updatedTopic;
        }
        return topic;
      });

      return updatedTopics;
    });
  };

  const getTopicIcon = (topic: Topic) => {
    if (topic.completed) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (!isTopicAccessible(topic)) {
      return <Lock className="h-4 w-4 text-gray-400" />;
    }
    return <ChevronRight className="h-4 w-4 shrink-0" />;
  };

  const getSectionIcon = (section: TopicSection, parentAccessible: boolean) => {
    if (section.completed) {
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    }
    if (!parentAccessible) {
      return <Lock className="h-3 w-3 text-gray-400" />;
    }
    if (section.isTest && section.testType === "hints") {
      return <HelpCircle className="h-3 w-3 text-blue-500" />;
    }
    if (section.isTest && section.testType === "final") {
      return <Target className="h-3 w-3 text-red-500" />;
    }
    return <ChevronRight className="h-3 w-3 shrink-0" />;
  };

  const isTopicAccessible = (topic: Topic) => {
    if (topic.isMainTopic && topic.id === "final-certification") {
      // Итоговая аттестация доступна только если все предыдущие темы пройдены
      const mainTopics = topics.filter(
        (t) => !t.isMainTopic || t.id !== "final-certification",
      );
      return mainTopics.every((t) => t.completed);
    }

    if (topic.isMainTopic) {
      return true; // Первая тема всегда доступна
    }

    // Находим индекс текущей темы
    const currentIndex = topics.findIndex((t) => t.id === topic.id);
    if (currentIndex === 0) return true;

    // Проверяем, завершена ли предыдущая тема
    const previousTopic = topics[currentIndex - 1];
    return previousTopic.completed;
  };

  const isSectionAccessible = (
    section: TopicSection,
    parentAccessible: boolean,
  ) => {
    return parentAccessible;
  };

  const getTopicProgress = (topic: Topic) => {
    let completed = 0;
    let total = 2; // Всегда 2 теста

    if (topic.hintsTestCompleted) completed++;
    if (topic.finalTestCompleted) completed++;

    return { completed, total };
  };

  const canTakeTest = (topic: Topic, testType: "hints" | "final") => {
    if (testType === "hints") {
      return !topic.hintsTestCompleted;
    }
    // Итоговый тест доступен только после прохождения теста с подсказками
    return topic.hintsTestCompleted && !topic.finalTestCompleted;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Accordion type="multiple" className="space-y-2">
        {topics.map((topic) => {
          const isAccessible = isTopicAccessible(topic);
          const progress = getTopicProgress(topic);

          return (
            <AccordionItem
              key={topic.id}
              value={topic.id}
              disabled={!isAccessible}
              className={`
                rounded-lg border-0 overflow-hidden transition-all duration-200
                ${
                  topic.isMainTopic
                    ? topic.completed
                      ? "bg-green-800 text-white"
                      : isAccessible
                        ? "bg-slate-800 text-white"
                        : "bg-gray-400 text-gray-600"
                    : topic.completed
                      ? "bg-green-50 hover:bg-green-100 border border-green-200"
                      : isAccessible
                        ? "bg-blue-50 hover:bg-blue-100 border border-blue-200"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              <AccordionTrigger
                className={`
                  px-4 py-3 hover:no-underline
                  ${
                    topic.isMainTopic
                      ? topic.completed
                        ? "text-white hover:bg-green-700"
                        : isAccessible
                          ? "text-white hover:bg-slate-700"
                          : "text-gray-600 cursor-not-allowed"
                      : topic.completed
                        ? "text-green-700 hover:bg-green-100"
                        : isAccessible
                          ? "text-blue-700 hover:bg-blue-100"
                          : "text-gray-500 cursor-not-allowed"
                  }
                  ${!isAccessible ? "pointer-events-none" : ""}
                `}
                disabled={!isAccessible}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {getTopicIcon(topic)}
                    <div className="text-left">
                      <span className="font-medium">{topic.title}</span>
                      {!topic.isMainTopic && isAccessible && (
                        <div className="text-xs opacity-75 mt-1">
                          Тесты: {progress.completed}/{progress.total}
                          {progress.completed > 0 &&
                            progress.completed < progress.total &&
                            " (в процессе)"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {topic.completed && (
                      <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                        Завершено
                      </span>
                    )}
                    {!topic.completed && isAccessible && !topic.isMainTopic && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                        Доступно
                      </span>
                    )}
                    {!isAccessible && (
                      <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full">
                        Заблокировано
                      </span>
                    )}
                  </div>
                </div>
              </AccordionTrigger>

              {isAccessible && (
                <AccordionContent className="px-4 pb-3">
                  <div
                    className={`
                      text-sm mb-3
                      ${
                        topic.isMainTopic
                          ? "text-slate-200"
                          : topic.completed
                            ? "text-green-700"
                            : "text-blue-700"
                      }
                    `}
                  >
                    {topic.content}
                  </div>

                  {/* Для итоговой аттестации показываем специальные кнопки */}
                  {topic.id === "final-certification" && isAccessible && (
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleCompleteTest(topic.id, "hints")}
                        disabled={topic.hintsTestCompleted}
                        className="mr-2 bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        {topic.hintsTestCompleted
                          ? "✓ Тест с подсказками пройден"
                          : "Тест с подсказками"}
                      </Button>
                      <Button
                        onClick={() => handleCompleteTest(topic.id, "final")}
                        disabled={
                          !canTakeTest(topic, "final") ||
                          topic.finalTestCompleted
                        }
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        {topic.finalTestCompleted
                          ? "✓ Итоговый тест пройден"
                          : "Итоговый тест"}
                      </Button>
                    </div>
                  )}

                  {topic.children && (
                    <div className="mt-3 space-y-1">
                      <Accordion type="multiple" className="space-y-1">
                        {topic.children.map((child) => {
                          const sectionAccessible = isSectionAccessible(
                            child,
                            isAccessible,
                          );

                          return (
                            <AccordionItem
                              key={child.id}
                              value={child.id}
                              disabled={!sectionAccessible}
                              className={`
                                rounded border-0 overflow-hidden
                                ${
                                  child.completed
                                    ? "bg-green-100 border border-green-300"
                                    : child.isTest && child.testType === "hints"
                                      ? "bg-blue-100 border border-blue-300"
                                      : child.isTest &&
                                          child.testType === "final"
                                        ? "bg-red-100 border border-red-300"
                                        : sectionAccessible
                                          ? "bg-slate-200 hover:bg-slate-300"
                                          : "bg-gray-100 cursor-not-allowed"
                                }
                              `}
                            >
                              <AccordionTrigger
                                className={`
                                  px-4 py-2 hover:no-underline
                                  ${
                                    child.completed
                                      ? "text-green-700 hover:bg-green-200"
                                      : child.isTest &&
                                          child.testType === "hints"
                                        ? "text-blue-700 hover:bg-blue-200"
                                        : child.isTest &&
                                            child.testType === "final"
                                          ? "text-red-700 hover:bg-red-200"
                                          : sectionAccessible
                                            ? "text-slate-700 hover:bg-slate-300"
                                            : "text-gray-500 cursor-not-allowed"
                                  }
                                  ${!sectionAccessible ? "pointer-events-none" : ""}
                                `}
                                disabled={!sectionAccessible}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-3">
                                    {getSectionIcon(child, sectionAccessible)}
                                    <span className="text-left text-sm font-medium">
                                      {child.title}
                                    </span>
                                  </div>
                                  {child.completed && (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  )}
                                  {!sectionAccessible && (
                                    <Lock className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                              </AccordionTrigger>

                              {sectionAccessible && (
                                <AccordionContent className="px-4 pb-2">
                                  <div
                                    className={`
                                      text-xs mb-2
                                      ${
                                        child.completed
                                          ? "text-green-600"
                                          : child.isTest &&
                                              child.testType === "hints"
                                            ? "text-blue-600"
                                            : child.isTest &&
                                                child.testType === "final"
                                              ? "text-red-600"
                                              : "text-slate-600"
                                      }
                                    `}
                                  >
                                    {child.content}
                                  </div>

                                  {child.isTest && !child.completed && (
                                    <Button
                                      onClick={() => {
                                        if (
                                          child.testType === "hints" &&
                                          canTakeTest(topic, "hints")
                                        ) {
                                          handleCompleteTest(
                                            topic.id,
                                            "hints",
                                            child.id,
                                          );
                                        } else if (
                                          child.testType === "final" &&
                                          canTakeTest(topic, "final")
                                        ) {
                                          handleCompleteTest(
                                            topic.id,
                                            "final",
                                            child.id,
                                          );
                                        }
                                      }}
                                      disabled={
                                        (child.testType === "hints" &&
                                          !canTakeTest(topic, "hints")) ||
                                        (child.testType === "final" &&
                                          !canTakeTest(topic, "final"))
                                      }
                                      className={`
                                        text-white text-xs
                                        ${
                                          child.testType === "hints"
                                            ? "bg-blue-600 hover:bg-blue-700"
                                            : "bg-red-600 hover:bg-red-700"
                                        }
                                      `}
                                      size="sm"
                                    >
                                      {child.testType === "hints" ? (
                                        <HelpCircle className="h-3 w-3 mr-1" />
                                      ) : (
                                        <Target className="h-3 w-3 mr-1" />
                                      )}
                                      Пройти тест
                                    </Button>
                                  )}

                                  {child.testType === "final" &&
                                    !canTakeTest(topic, "final") &&
                                    !child.completed && (
                                      <div className="text-xs text-gray-500 mt-2">
                                        Сначала пройдите тест с подсказками
                                      </div>
                                    )}
                                </AccordionContent>
                              )}
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </div>
                  )}
                </AccordionContent>
              )}
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default TopicAccordion;
