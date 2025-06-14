import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ChevronRight, CheckCircle, Lock, Play } from "lucide-react";
import { useState } from "react";

interface TopicSection {
  id: string;
  title: string;
  content: string;
  completed?: boolean;
}

interface Topic {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  isMainTopic?: boolean;
  children?: TopicSection[];
}

const topicData: Topic[] = [
  {
    id: "introduction",
    title: "Введение в газотурбинные двигатели",
    content: "Основополагающий курс по принципам работы и конструкции ГТД.",
    completed: true,
    isMainTopic: true,
    children: [
      {
        id: "history",
        title: "История развития ГТД",
        content:
          "Эволюция газотурбинных технологий от первых образцов до современных двигателей.",
        completed: true,
      },
      {
        id: "classification",
        title: "Классификация и типы ГТД",
        content: "Различные типы газотурбинных двигателей и их применение.",
        completed: true,
      },
      {
        id: "basic-principles",
        title: "Основные принципы работы",
        content: "Цикл Б��айтона и принципы преобразования энергии в ГТД.",
        completed: true,
      },
      {
        id: "introduction-test",
        title: "Итоговый тест - Введение",
        content: "Проверка знаний по основам газотурбинных двигателей.",
        completed: true,
      },
    ],
  },
  {
    id: "thermodynamics",
    title: "Термодинамические основы ГТД",
    content: "Изучение термодинамических процессов в газотурбинных двигателях.",
    completed: true,
    children: [
      {
        id: "brayton-cycle",
        title: "Цикл Брайтона",
        content: "Идеальный и действительный циклы, КПД цикла.",
        completed: true,
      },
      {
        id: "heat-transfer",
        title: "Теплообмен в ГТД",
        content: "Процессы теплопередачи в различных узлах двигателя.",
        completed: true,
      },
      {
        id: "gas-dynamics",
        title: "Газодинамика проточной части",
        content: "Течение газа через компрессор, камеру сгорания и турбину.",
        completed: true,
      },
      {
        id: "thermodynamics-test",
        title: "Итоговый тест - Термодинамика",
        content: "Контроль знаний по термодинамическим процессам.",
        completed: true,
      },
    ],
  },
  {
    id: "compressors",
    title: "К��мпрессоры ГТД",
    content: "Конструкция, принципы работы и характеристики компрессоров.",
    completed: false,
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
        id: "compressors-test",
        title: "Итоговый тест - Компрессоры",
        content: "Проверка знаний по компрессорам ГТД.",
      },
    ],
  },
  {
    id: "combustion",
    title: "Камеры сгорания",
    content:
      "Процессы горения, конструкция и рабочие характеристики камер сгорания.",
    completed: false,
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
        id: "combustion-test",
        title: "Итоговый тест - Камеры сгорания",
        content: "��онтроль знаний по камерам сгорания.",
      },
    ],
  },
  {
    id: "turbines",
    title: "Турбины ГТД",
    content: "Конструкция и работа турбин высокого и низкого давления.",
    completed: false,
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
        id: "turbines-test",
        title: "Итоговый тест - Турбины",
        content: "Проверка знаний по турбин��м ГТД.",
      },
    ],
  },
  {
    id: "control-systems",
    title: "Системы управления ГТД",
    content: "Автоматическое управление и регулирование работы двигателя.",
    completed: false,
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
        id: "control-test",
        title: "Итоговый тест - Системы управления",
        content: "Контроль знаний по системам управления.",
      },
    ],
  },
  {
    id: "operation",
    title: "Эксплуатация и обслуживание ГТД",
    content: "Практические аспекты эксплуатации газотурбинных двигателей.",
    completed: false,
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
        id: "operation-test",
        title: "Итоговый тест - Эксплуатация",
        content: "Проверка знаний по эксплуатации ГТД.",
      },
    ],
  },
  {
    id: "diagnostics",
    title: "Диагностика и устранение неисправностей",
    content: "Методы диагностики состояния и поиск неисправностей ГТД.",
    completed: false,
    children: [
      {
        id: "diagnostic-methods",
        title: "Методы диагностики",
        content: "Вибродиагностика, термография, эндоскопия.",
      },
      {
        id: "fault-analysis",
        title: "Анализ неисправностей",
        content: "Типичные неисправно��ти и методы их выявления.",
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
        id: "diagnostics-test",
        title: "Итоговый тест - Диагностика",
        content: "Контроль знаний по диагностике ГТД.",
      },
    ],
  },
  {
    id: "final-certification",
    title: "Итоговая аттестация",
    content: "Комплексная проверка знаний по всем разделам курса ГТД.",
    completed: false,
    isMainTopic: true,
  },
];

const TopicAccordion = () => {
  const [topics, setTopics] = useState<Topic[]>(topicData);

  const handleCompleteTest = (topicId: string) => {
    setTopics((prevTopics) =>
      prevTopics.map((topic) =>
        topic.id === topicId ? { ...topic, completed: true } : topic,
      ),
    );
  };

  const getTopicIcon = (topic: Topic) => {
    if (topic.completed) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (!topic.completed && !topic.isMainTopic) {
      return <Lock className="h-4 w-4 text-gray-400" />;
    }
    return <ChevronRight className="h-4 w-4 shrink-0" />;
  };

  const getSectionIcon = (section: TopicSection, parentCompleted: boolean) => {
    if (section.completed) {
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    }
    if (!parentCompleted) {
      return <Lock className="h-3 w-3 text-gray-400" />;
    }
    return <ChevronRight className="h-3 w-3 shrink-0" />;
  };

  const isTopicAccessible = (topic: Topic) => {
    return topic.completed || topic.isMainTopic;
  };

  const isSectionAccessible = (
    section: TopicSection,
    parentCompleted: boolean,
  ) => {
    return section.completed || parentCompleted;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Accordion type="multiple" className="space-y-2">
        {topics.map((topic) => {
          const isAccessible = isTopicAccessible(topic);

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
                      : "bg-slate-800 text-white"
                    : topic.completed
                      ? "bg-green-50 hover:bg-green-100 border border-green-200"
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
                        : "text-white hover:bg-slate-700"
                      : topic.completed
                        ? "text-green-700 hover:bg-green-100"
                        : "text-gray-500 cursor-not-allowed"
                  }
                  ${!isAccessible ? "pointer-events-none" : ""}
                `}
                disabled={!isAccessible}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {getTopicIcon(topic)}
                    <span className="text-left font-medium">{topic.title}</span>
                  </div>
                  {topic.completed && (
                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                      Пройдено
                    </span>
                  )}
                  {!topic.completed && !topic.isMainTopic && (
                    <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full">
                      Заблокировано
                    </span>
                  )}
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
                            : "text-slate-600"
                      }
                    `}
                  >
                    {topic.content}
                  </div>

                  {!topic.completed && !topic.children && (
                    <Button
                      onClick={() => handleCompleteTest(topic.id)}
                      className="mb-3 bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Пройти итоговый тест
                    </Button>
                  )}

                  {topic.children && (
                    <div className="mt-3 space-y-1">
                      <Accordion type="multiple" className="space-y-1">
                        {topic.children.map((child) => {
                          const sectionAccessible = isSectionAccessible(
                            child,
                            topic.completed,
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
                                    {getSectionIcon(child, topic.completed)}
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
                                      ${child.completed ? "text-green-600" : "text-slate-600"}
                                    `}
                                  >
                                    {child.content}
                                  </div>

                                  {child.title.includes("Итоговый тест") &&
                                    !child.completed && (
                                      <Button
                                        onClick={() => {
                                          setTopics((prevTopics) =>
                                            prevTopics.map((topic) =>
                                              topic.id === topic.id
                                                ? {
                                                    ...topic,
                                                    children:
                                                      topic.children?.map(
                                                        (section) =>
                                                          section.id ===
                                                          child.id
                                                            ? {
                                                                ...section,
                                                                completed: true,
                                                              }
                                                            : section,
                                                      ),
                                                  }
                                                : topic,
                                            ),
                                          );
                                          if (child.id.includes("test")) {
                                            handleCompleteTest(topic.id);
                                          }
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                        size="sm"
                                      >
                                        <Play className="h-3 w-3 mr-1" />
                                        Пройти тест
                                      </Button>
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
