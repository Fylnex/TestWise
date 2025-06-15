import React, { createContext, useContext, useState, useEffect } from "react";
import { topicData as initialTopicData } from "@/components/TopicAccordion";

interface TopicContextType {
  topics: typeof initialTopicData;
  completeTest: (topicId: string, sectionId: string, testType: "hints" | "final") => void;
  resetProgress: () => void;
}

const TopicContext = createContext<TopicContextType | undefined>(undefined);

export const TopicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [topics, setTopics] = useState(() => {
    const savedTopics = localStorage.getItem("topics");
    return savedTopics ? JSON.parse(savedTopics) : initialTopicData;
  });

  useEffect(() => {
    localStorage.setItem("topics", JSON.stringify(topics));
  }, [topics]);

  const completeTest = (topicId: string, sectionId: string, testType: "hints" | "final") => {
    setTopics((prevTopics: typeof initialTopicData) => {
      return prevTopics.map((topic) => {
        if (topic.id === topicId) {
          const updatedTopic = { ...topic };
          
          if (testType === "hints") {
            updatedTopic.hintsTestCompleted = true;
          } else if (testType === "final") {
            updatedTopic.finalTestCompleted = true;
          }

          // Проверяем, завершены ли оба теста
          if (updatedTopic.hintsTestCompleted && updatedTopic.finalTestCompleted) {
            updatedTopic.completed = true;
          }

          // Обновляем дочерние секции
          if (topic.children) {
            updatedTopic.children = topic.children.map((child) =>
              child.id === sectionId ? { ...child, completed: true } : child
            );
          }

          return updatedTopic;
        }
        return topic;
      });
    });
  };

  const resetProgress = () => {
    localStorage.removeItem("topics");
    setTopics(initialTopicData);
  };

  return (
    <TopicContext.Provider value={{ topics, completeTest, resetProgress }}>
      {children}
    </TopicContext.Provider>
  );
};

export const useTopics = () => {
  const context = useContext(TopicContext);
  if (context === undefined) {
    throw new Error("useTopics must be used within a TopicProvider");
  }
  return context;
}; 