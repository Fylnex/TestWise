import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronRight } from "lucide-react";

const topicData = [
  {
    id: "topic-main",
    title: "Название темы",
    isMainTopic: true,
    content: "Основная тема с подробным описанием содержания.",
  },
  {
    id: "topic-general",
    title: "Название темы",
    content: "Общая тема для обсуждения различных вопросов.",
    children: [
      {
        id: "section-1",
        title: "Название раздела-1",
        content: "Подробное описание первого раздела темы.",
      },
      {
        id: "section-2",
        title: "Название раздела-2",
        content: "Подробное описание второго раздела темы.",
      },
      {
        id: "section-3",
        title: "Название раздела-3",
        content: "Подробное описание третьего раздела темы.",
      },
      {
        id: "section-4",
        title: "Название раздела-4",
        content: "Подробное описание четвёртого раздела темы.",
      },
      {
        id: "test-topic",
        title: "Тест по теме",
        content: "Интерактивный тест для проверки знаний по данной теме.",
      },
      {
        id: "final-test",
        title: "Итоговый тест по теме",
        content: "Финальный тест для оценки общего понимания темы.",
      },
    ],
  },
  {
    id: "topic-2",
    title: "Название темы",
    content: "Дополнительная тема для изучения специфических вопросов.",
  },
  {
    id: "topic-3",
    title: "Название темы",
    content: "Ещё одна тема для расширения знаний.",
  },
  {
    id: "topic-4",
    title: "Название темы",
    content: "Тема для углублённого изучения предмета.",
  },
  {
    id: "topic-5",
    title: "Название темы",
    content: "Дополнительная тема для практических занятий.",
  },
  {
    id: "topic-6",
    title: "Название темы",
    content: "Заключительная тема курса.",
  },
  {
    id: "final-topic-test",
    title: "Итоговый тест по темам",
    content: "Общий итоговый тест по всем изученным темам курса.",
  },
];

const TopicAccordion = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Accordion type="multiple" className="space-y-2">
        {topicData.map((topic) => (
          <AccordionItem
            key={topic.id}
            value={topic.id}
            className={`
              rounded-lg border-0 overflow-hidden
              ${
                topic.isMainTopic
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 hover:bg-slate-50"
              }
            `}
          >
            <AccordionTrigger
              className={`
                px-4 py-3 hover:no-underline
                ${
                  topic.isMainTopic
                    ? "text-white hover:bg-slate-700"
                    : "text-slate-700 hover:bg-slate-100"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <ChevronRight className="h-4 w-4 shrink-0" />
                <span className="text-left font-medium">{topic.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div
                className={`
                text-sm 
                ${topic.isMainTopic ? "text-slate-200" : "text-slate-600"}
              `}
              >
                {topic.content}
              </div>

              {topic.children && (
                <div className="mt-3 space-y-1">
                  <Accordion type="multiple" className="space-y-1">
                    {topic.children.map((child) => (
                      <AccordionItem
                        key={child.id}
                        value={child.id}
                        className="bg-slate-200 rounded border-0 overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 py-2 text-slate-700 hover:bg-slate-300 hover:no-underline">
                          <div className="flex items-center gap-3">
                            <ChevronRight className="h-3 w-3 shrink-0" />
                            <span className="text-left text-sm font-medium">
                              {child.title}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-2">
                          <div className="text-xs text-slate-600">
                            {child.content}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default TopicAccordion;
