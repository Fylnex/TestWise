// TestWise/src/pages/TopicPage.tsx
// -*- coding: utf-8 -*-
// """Страница темы в TestWise.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Отображает информацию о теме, ее секциях, подсекциях и тестах,
// а также предоставляет интерфейс для создания секций и тестов
// для администраторов и учителей.
// """

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Section, Topic, topicApi } from "@/services/topicApi";
import { Test, testApi } from "@/services/testApi";
import { sectionApi, Subsection } from "@/services/sectionApi";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle, Trash2, Pencil } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";

const TopicPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const { user } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  // Модалки и формы
  const [openSection, setOpenSection] = useState(false);
  const [openTest, setOpenTest] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    title: "",
    description: "",
    order: 0,
    content: "",
  });
  const [testForm, setTestForm] = useState({
    title: "",
    type: "hinted",
    duration: "",
    question_ids: "",
  });
  const [creatingSection, setCreatingSection] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);
  const [errorSection, setErrorSection] = useState<string | null>(null);
  const [errorTest, setErrorTest] = useState<string | null>(null);

  const [subsectionsMap, setSubsectionsMap] = useState<Record<number, any[]>>(
    {},
  );

  const [openSubsection, setOpenSubsection] = useState<Record<number, boolean>>(
    {},
  );
  const [subsectionForm, setSubsectionForm] = useState<Record<number, any>>({});
  const [errorSubsection, setErrorSubsection] = useState<
    Record<number, string | null>
  >({});
  const [creatingSubsection, setCreatingSubsection] = useState<
    Record<number, boolean>
  >({});

  const [openQuestionsEditor, setOpenQuestionsEditor] = useState<number | null>(
    null,
  );

  const [editMode, setEditMode] = useState(false);

  const [openSectionTestId, setOpenSectionTestId] = useState<number | null>(
    null,
  );
  const [sectionTestForm, setSectionTestForm] = useState({
    title: "",
    type: "hinted",
    duration: "",
    question_ids: "",
  });
  const [creatingSectionTest, setCreatingSectionTest] = useState(false);
  const [errorSectionTest, setErrorSectionTest] = useState<string | null>(null);

  const [deleteInput, setDeleteInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [openSubsectionForm, setOpenSubsectionForm] = useState<
    Record<number, boolean>
  >({});
  const [editSubsection, setEditSubsection] = useState<
    Record<number, Subsection | null>
  >({});
  const [subsectionFormData, setSubsectionFormData] = useState<
    Record<number, SubsectionFormData>
  >({});
  const [subsectionLoading, setSubsectionLoading] = useState<
    Record<number, boolean>
  >({});
  const [subsectionError, setSubsectionError] = useState<
    Record<number, string | null>
  >({});

  const [sectionToDelete, setSectionToDelete] = useState<number | null>(null);

  // 1. State for editing section
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [editSectionForm, setEditSectionForm] = useState({
    title: '',
    description: '',
  });
  const [editingSection, setEditingSection] = useState(false);
  const [errorEditSection, setErrorEditSection] = useState<string | null>(null);

  interface SubsectionFormData {
    file?: File;
    type: "text" | "pdf";
    section_id: number;
    title: string;
    content?: string;
    order: number;
  }

  const navigate = useNavigate();

  useEffect(() => {
    if (!topicId) return;
    setLoading(true);
    Promise.all([
      topicApi.getTopic(Number(topicId)),
      topicApi.getSectionsByTopic(Number(topicId)),
      testApi.getTestsByTopic(Number(topicId)),
    ])
      .then(async ([topicData, sectionsData, testsData]) => {
        setTopic(topicData);
        setSections(sectionsData.sort((a, b) => a.order - b.order));
        setTests(testsData);
        // Загружаем подсекции для каждой секции
        const subsMap: Record<number, Subsection[]> = {};
        await Promise.all(
          sectionsData.map(async (section) => {
            try {
              const res = await sectionApi.getSectionSubsections(section.id);
              subsMap[section.id] = res.subsections || [];
            } catch (error) {
              console.error(
                `Failed to load subsections for section ${section.id}:`,
                error,
              );
              subsMap[section.id] = [];
            }
          }),
        );
        setSubsectionsMap(subsMap);
      })
      .catch((error) => console.error("Error loading topic data:", error))
      .finally(() => setLoading(false));
  }, [topicId]);

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingSection(true);
    setErrorSection(null);
    try {
      const newSection = await topicApi.createSection({
        ...sectionForm,
        topic_id: Number(topicId),
        order: Number(sectionForm.order),
      });
      setSections((prev) =>
        [...prev, newSection].sort((a, b) => a.order - b.order),
      );
      setSectionForm({ title: "", description: "", order: 0, content: "" });
      setOpenSection(false);
    } catch (err) {
      setErrorSection("Ошибка при создании секции");
    } finally {
      setCreatingSection(false);
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTest(true);
    setErrorTest(null);
    try {
      const newTest = await testApi.createTest({
        ...testForm,
        topic_id: Number(topicId),
        duration: testForm.duration ? Number(testForm.duration) : null,
        question_ids: testForm.question_ids
          ? testForm.question_ids.split(",").map((id) => Number(id.trim()))
          : undefined,
      });
      setTests((prev) => [...prev, newTest]);
      setTestForm({
        title: "",
        type: "hinted",
        duration: "",
        question_ids: "",
      });
      setOpenTest(false);
    } catch (err) {
      setErrorTest("Ошибка при создании теста");
    } finally {
      setCreatingTest(false);
    }
  };

  const handleOpenSubsection = (sectionId: number) => {
    setOpenSubsection((prev) => ({ ...prev, [sectionId]: true }));
    setSubsectionForm((prev) => ({
      ...prev,
      [sectionId]: {
        title: "",
        order: 0,
        content: "",
        type: "default",
        section_id: sectionId,
      },
    }));
    setErrorSubsection((prev) => ({ ...prev, [sectionId]: null }));
  };

  const handleCloseSubsection = (sectionId: number) => {
    setOpenSubsection((prev) => ({ ...prev, [sectionId]: false }));
  };

  const handleCreateSubsection = async (
    e: React.FormEvent,
    sectionId: number,
  ) => {
    e.preventDefault();
    console.debug(
      "Submitting subsection form for section",
      sectionId,
      subsectionFormData[sectionId],
    );
    setCreatingSubsection((prev) => ({ ...prev, [sectionId]: true }));
    setErrorSubsection((prev) => ({ ...prev, [sectionId]: null }));

    try {
      const form = subsectionFormData[sectionId]!;
      const formData = new FormData();
      formData.append("section_id", String(sectionId));
      formData.append("title", form.title || "");
      formData.append("type", form.type || "text");
      formData.append("order", String(form.order || 0));

      if (form.type === "pdf" && form.file) {
        formData.append("file", form.file);
      } else {
        formData.append("content", form.content || "");
      }

      // Логируем все поля FormData перед отправкой
      for (const [key, value] of formData.entries()) {
        console.debug(`FormData field: ${key} =`, value);
      }

      let newSub: Subsection;
      if (editSubsection[sectionId]) {
        console.debug(
          "Updating existing subsection ID=",
          editSubsection[sectionId]!.id,
        );
        if (form.type === 'pdf') {
          const formData = new FormData();
          formData.append('section_id', String(sectionId));
          formData.append('title', form.title);
          formData.append('type', 'pdf');
          formData.append('order', String(form.order));
          if (form.file) formData.append('file', form.file);
          newSub = await sectionApi.updateSubsection(
            editSubsection[sectionId]!.id,
            formData
          );
        } else {
          newSub = await sectionApi.updateSubsectionJson(
            editSubsection[sectionId]!.id,
            {
              title: form.title,
              content: form.content,
              type: form.type,
              order: form.order,
            }
          );
        }
      } else {
        if (form.type === 'pdf') {
          const formData = new FormData();
          formData.append('section_id', String(sectionId));
          formData.append('title', form.title);
          formData.append('type', 'pdf');
          formData.append('order', String(form.order));
          if (form.file) formData.append('file', form.file);
          console.debug("Creating new subsection via multipart/form-data");
          newSub = await sectionApi.createSubsection(formData);
        } else {
          const payload = {
            section_id: sectionId,
            title: form.title,
            content: form.content || "",
            type: "text" as const,
            order: form.order,
          };
          console.debug("Creating new subsection via JSON");
          newSub = await sectionApi.createSubsectionJson(payload);
        }
      }

      console.debug("Server returned new subsection:", newSub);
      setSubsectionsMap((prev) => ({
        ...prev,
        [sectionId]: editSubsection[sectionId]
          ? prev[sectionId].map((s) => (s.id === newSub.id ? newSub : s))
          : [...(prev[sectionId] || []), newSub].sort(
              (a, b) => a.order - b.order,
            ),
      }));
      handleCloseSubsectionForm(sectionId);
    } catch (err) {
      console.error("Error creating/updating subsection:", err);
      setSubsectionError((prev) => ({
        ...prev,
        [sectionId]: "Ошибка при создании подсекции",
      }));
    } finally {
      setCreatingSubsection((prev) => ({ ...prev, [sectionId]: false }));
    }
  };

  const handleCreateSectionTest = async (
    e: React.FormEvent,
    sectionId: number,
  ) => {
    e.preventDefault();
    setCreatingSectionTest(true);
    setErrorSectionTest(null);
    try {
      const newTest = await testApi.createTest({
        ...sectionTestForm,
        section_id: sectionId,
        topic_id: Number(topicId),
        duration: sectionTestForm.duration
          ? Number(sectionTestForm.duration)
          : null,
        question_ids: sectionTestForm.question_ids
          ? sectionTestForm.question_ids
              .split(",")
              .map((id) => Number(id.trim()))
          : undefined,
      });
      // Добавляем тест только в секцию
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? ({
                ...s,
                tests: [
                  ...((s as Section & { tests?: Test[] }).tests || []),
                  newTest,
                ],
              } as Section & { tests: Test[] })
            : s,
        ),
      );
      setSectionTestForm({
        title: "",
        type: "hinted",
        duration: "",
        question_ids: "",
      });
      setOpenSectionTestId(null);
    } catch (err) {
      setErrorSectionTest("Ошибка при создании теста для секции");
    } finally {
      setCreatingSectionTest(false);
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    try {
      await topicApi.deleteSection(sectionId);
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
    } catch {
      alert("Ошибка удаления секции");
    }
  };

  const handleDeleteSubsection = async (subId: number, sectionId: number) => {
    if (!window.confirm("Удалить подсекцию?")) return;
    try {
      await sectionApi.deleteSubsection(subId);
      setSubsectionsMap((prev) => ({
        ...prev,
        [sectionId]: prev[sectionId].filter((s) => s.id !== subId),
      }));
    } catch {
      alert("Ошибка удаления подсекции");
    }
  };

  const handleDeleteSectionTest = async (testId: number, sectionId: number) => {
    if (!window.confirm("Удалить тест?")) return;
    try {
      await testApi.deleteTest(testId);
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? ({
                ...s,
                tests: ((s as Section & { tests?: Test[] }).tests || []).filter(
                  (t) => t.id !== testId,
                ),
              } as Section & { tests: Test[] })
            : s,
        ),
      );
    } catch {
      alert("Ошибка удаления теста");
    }
  };

  // Функция для открытия формы создания подраздела
  // При открытии формы:
  const handleOpenCreateSubsection = (sectionId: number) => {
    setOpenSubsectionForm((prev) => ({ ...prev, [sectionId]: true }));
    setEditSubsection((prev) => ({ ...prev, [sectionId]: null }));
    setSubsectionFormData((prev) => ({
      ...prev,
      [sectionId]: {
        title: "",
        content: "",
        order: 0,
        type: "text", // сразу TEXT
        section_id: sectionId,
      },
    }));
    setSubsectionError((prev) => ({ ...prev, [sectionId]: null }));
  };

  // Функция для открытия формы редактирования подраздела
  const handleOpenEditSubsection = (sectionId: number, sub: Subsection) => {
    console.debug("Opening edit form for subsection", sub);
    setOpenSubsectionForm((prev) => ({ ...prev, [sectionId]: true }));
    setEditSubsection((prev) => ({ ...prev, [sectionId]: sub }));
    setSubsectionFormData((prev) => ({ ...prev, [sectionId]: { ...sub } }));
    setSubsectionError((prev) => ({ ...prev, [sectionId]: null }));
  };

  // Функция для закрытия формы
  const handleCloseSubsectionForm = (sectionId: number) => {
    console.debug("Closing form for subsection in section", sectionId);
    setOpenSubsectionForm((prev) => ({ ...prev, [sectionId]: false }));
    setEditSubsection((prev) => ({ ...prev, [sectionId]: null }));
    setSubsectionFormData((prev) => ({
      ...prev,
      [sectionId]: {
        title: "",
        content: "",
        order: 0,
        type: "text",
        section_id: sectionId,
      },
    }));
    setSubsectionError((prev) => ({ ...prev, [sectionId]: null }));
  };

  // Функция для создания/редактирования подраздела
  const handleSubmitSubsection = async (
      e: React.FormEvent,
      sectionId: number,
  ) => {
    e.preventDefault();
    setSubsectionLoading((prev) => ({ ...prev, [sectionId]: true }));
    setSubsectionError((prev) => ({ ...prev, [sectionId]: null }));

    try {
      const form = subsectionFormData[sectionId]!;
      let newSub: Subsection;

      if (form.type === "text") {
        const payload = {
          section_id: sectionId,
          title: form.title,
          content: form.content || "",
          type: "text" as const,
          order: form.order,
        };

        if (editSubsection[sectionId]) {
          // UPDATE TEXT subsection via JSON PUT
          newSub = await sectionApi.updateSubsectionJson(
              editSubsection[sectionId]!.id,
              payload,
          );
        } else {
          // CREATE TEXT subsection via JSON POST
          newSub = await sectionApi.createSubsectionJson(payload);
        }
      } else {
        // PDF: build FormData
        const formData = new FormData();
        formData.append("section_id", String(sectionId));
        formData.append("title", form.title);
        formData.append("type", "pdf");
        formData.append("order", String(form.order));
        if (form.file) formData.append("file", form.file);

        if (editSubsection[sectionId]) {
          // UPDATE PDF subsection via multipart PUT
          newSub = await sectionApi.updateSubsection(
              editSubsection[sectionId]!.id,
              formData,
          );
        } else {
          // CREATE PDF subsection via multipart POST
          newSub = await sectionApi.createSubsection(formData);
        }
      }

      setSubsectionsMap((prev) => ({
        ...prev,
        [sectionId]: editSubsection[sectionId]
            ? prev[sectionId].map((s) => (s.id === newSub.id ? newSub : s))
            : [...(prev[sectionId] || []), newSub].sort(
                (a, b) => a.order - b.order,
            ),
      }));

      handleCloseSubsectionForm(sectionId);
    } catch (err) {
      console.error("Ошибка при сохранении подраздела:", err);
      setSubsectionError((prev) => ({
        ...prev,
        [sectionId]: "Ошибка при сохранении подраздела",
      }));
    } finally {
      setSubsectionLoading((prev) => ({ ...prev, [sectionId]: false }));
    }
  };

  // 2. Handler to open edit modal
  const handleOpenEditSection = (section: Section) => {
    setEditSection(section);
    setEditSectionForm({
      title: section.title || '',
      description: section.description || '',
    });
    setErrorEditSection(null);
  };

  // 3. Handler to submit edit
  const handleEditSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSection) return;
    setEditingSection(true);
    setErrorEditSection(null);
    try {
      const updated = await sectionApi.updateSection(editSection.id, {
        ...editSectionForm,
      });
      setSections((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      setEditSection(null);
    } catch (err) {
      setErrorEditSection('Ошибка при редактировании раздела');
    } finally {
      setEditingSection(false);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50">
          <Header/>
          <div className="container mx-auto py-10 text-center text-gray-400">
            Загрузка...
          </div>
        </div>
    );
  }
  if (!topic) {
    return (
        <div className="min-h-screen bg-gray-50">
          <Header/>
          <div className="container mx-auto py-10 text-center text-gray-400">
            Тема не найдена
          </div>
        </div>
    );
  }

  const isEmpty = sections.length === 0 && tests.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="container mx-auto w-full max-w-4xl px-4 flex flex-col flex-1 mb-16">
        <div className="pt-6 pb-2 flex items-center justify-between">
          <Breadcrumbs />
          {(user?.role === "admin" || user?.role === "teacher") && (
              <Button
                  size="sm"
                  variant={editMode ? "default" : "outline"}
                  onClick={() => setEditMode((e) => !e)}
              >
                {editMode ? "Завершить" : "Редактировать"}
            </Button>
          )}
        </div>
        <div className="mb-8 mt-2">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-sans mb-2">
            {topic.title}
          </h1>
          {topic.description && (
              <p className="text-lg text-gray-600 max-w-2xl font-sans mb-2">
                {topic.description}
              </p>
          )}
        </div>
        {(user?.role === "admin" || user?.role === "teacher") && editMode && (
          <div className="mb-8 flex gap-4 flex-wrap">
            <Button
                variant="outline"
                className="rounded-full border-[#3A86FF] text-[#3A86FF]"
                onClick={() => setOpenSection(true)}
            >
              <PlusCircle className="mr-2 h-5 w-5" /> Добавить раздел
            </Button>
            <Button
                variant="outline"
                className="rounded-full border-[#3A86FF] text-[#3A86FF]"
                onClick={() => navigate(`/test/create/topic/${topic.id}`)}
            >
              <PlusCircle className="mr-2 h-5 w-5" /> Добавить тест
            </Button>
          </div>
        )}
        <Accordion
            type="multiple"
            className="bg-transparent"
            defaultValue={sections.map((s) => String(s.id))}
        >
          {sections.map((section) => (
              <AccordionItem
                  key={section.id}
                  value={String(section.id)}
                  className="bg-white rounded-2xl shadow-sm mb-4 border border-gray-200"
              >
                <div className="flex items-center">
                  <AccordionTrigger className="flex-1 text-xl font-semibold px-6 py-4 text-left text-gray-900 hover:text-[#3A86FF] focus:outline-none flex items-center gap-2">
                    <span
                        className="flex-1 cursor-pointer select-none hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/section/tree/${section.id}`);
                        }}
                    >
                      {section.title}
                    </span>
                    {/* Иконка раскрытия/сворачивания */}
                    <span
                        className="ml-2 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                      {/* Иконка будет автоматически добавлена AccordionTrigger */}
                    </span>
                  </AccordionTrigger>
                  {(user?.role === "admin" || user?.role === "teacher") && editMode && (
                    <div className="flex items-center ml-2 gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-blue-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditSection(section);
                        }}
                        title="Редактировать раздел"
                      >
                        <Pencil className="w-5 h-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSectionToDelete(section.id);
                        }}
                        title="Удалить раздел"
                      >
                        <Trash2 className="h-5 w-5"/>
                      </Button>
                    </div>
                  )}
                </div>
                <AccordionContent className="px-6 pb-4">
                  {section.description && (
                      <p className="text-gray-600 mb-2">{section.description}</p>
                  )}
                  {/* Подразделы */}
                  {(user?.role === "admin" || user?.role === "teacher") &&
                      editMode && (
                          <Button
                              variant="outline"
                              className="flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full border-[#3A86FF] text-[#3A86FF] mb-2"
                              onClick={() => handleOpenCreateSubsection(section.id)}
                          >
                            <PlusCircle className="h-4 w-4"/>{" "}
                            <span>Добавить подраздел</span>
                          </Button>
                      )}
                  {openSubsectionForm[section.id] && (
                      <form
                          onSubmit={(e) => handleSubmitSubsection(e, section.id)}
                          className="bg-gray-50 rounded-xl p-4 mb-4 flex flex-col gap-2"
                      >
                      <input
                        className="border rounded px-2 py-1"
                        placeholder="Название подраздела"
                        value={subsectionFormData[section.id]?.title || ""}
                        onChange={(e) =>
                            setSubsectionFormData((prev) => ({
                              ...prev,
                              [section.id]: {
                                ...prev[section.id],
                                title: e.target.value,
                              },
                            }))
                        }
                        required
                      />
                      <textarea
                        className="border rounded px-2 py-1"
                        placeholder="Содержимое подраздела"
                        value={subsectionFormData[section.id]?.content || ""}
                        onChange={(e) =>
                            setSubsectionFormData((prev) => ({
                              ...prev,
                              [section.id]: {
                                ...prev[section.id],
                                content: e.target.value,
                              },
                            }))
                        }
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-1 rounded"
                            disabled={subsectionLoading[section.id]}
                        >
                          {editSubsection[section.id] ? "Сохранить" : "Создать"}
                        </button>
                        <button
                            type="button"
                            className="bg-gray-300 text-gray-700 px-4 py-1 rounded"
                            onClick={() => handleCloseSubsectionForm(section.id)}
                        >
                          Отмена
                        </button>
                      </div>
                        {subsectionError[section.id] && (
                            <div className="text-red-500 text-sm">
                              {subsectionError[section.id]}
                            </div>
                        )}
                    </form>
                  )}
                  {subsectionsMap[section.id]?.length > 0 && (
                    <div className="mb-2">
                      <div className="font-semibold text-gray-700 mb-1">
                        Подразделы:
                      </div>
                      <ul className="flex flex-col gap-2">
                        {subsectionsMap[section.id].map((sub) => (
                            <li
                                key={sub.id}
                                className="bg-gray-50 rounded-xl px-4 py-2 flex items-center justify-between"
                            >
                            <span
                              className="text-gray-800 font-sans cursor-pointer hover:underline"
                              onClick={() => navigate(`/section/tree/${section.id}?sub=${sub.id}`)}
                            >
                              {sub.title}
                            </span>
                              {(user?.role === "admin" ||
                                      user?.role === "teacher") &&
                                  editMode && (
                                      <div className="flex gap-2">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-blue-600"
                                            onClick={() =>
                                                handleOpenEditSubsection(section.id, sub)
                                            }
                                            title="Редактировать подраздел"
                                        >
                                          <Pencil className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-destructive"
                                            onClick={() =>
                                                handleDeleteSubsection(sub.id, section.id)
                                            }
                                            title="Удалить подраздел"
                                        >
                                          <Trash2 className="h-4 w-4"/>
                                        </Button>
                                      </div>
                                  )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Тесты секции */}
                  {((section as Section & { tests?: Test[] }).tests)?.length > 0 && (
                    <div className="mb-2">
                      <div className="font-semibold text-gray-700 mb-1">
                        Тесты:
                      </div>
                      <ul className="flex flex-col gap-2">
                        {((section as Section & { tests?: Test[] }).tests)?.map((test) => (
                            <li
                                key={test.id}
                                className="bg-gray-50 rounded-xl px-4 py-2 flex items-center justify-between"
                            >
                            <span className="text-gray-800 font-sans">
                              {test.title}
                            </span>
                              {(user?.role === "admin" ||
                                      user?.role === "teacher") &&
                                  editMode && (
                                      <Button
                                          size="icon"
                                          variant="ghost"
                                          className="text-destructive"
                                          onClick={() =>
                                              handleDeleteSectionTest(test.id, section.id)
                                          }
                                          title="Удалить тест"
                                      >
                                        <Trash2 className="h-4 w-4"/>
                                      </Button>
                                  )}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {/* Кнопки добавления в секцию */}
                  {(user?.role === "admin" || user?.role === "teacher") &&
                      editMode && (
                          <div className="mt-2 flex gap-3 flex-wrap">
                            <Button
                                variant="outline"
                                className="flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full border-[#3A86FF] text-[#3A86FF]"
                                onClick={() =>
                                    navigate(`/test/create/section/${section.id}`)
                                }
                            >
                              <PlusCircle className="h-4 w-4"/>{" "}
                              <span>Добавить тест</span>
                            </Button>
                          </div>
                      )}
                </AccordionContent>
              </AccordionItem>
          ))}
        </Accordion>
        {/* Тесты по теме */}
        {tests.length > 0 && (
          <div className="mt-10">
            <div className="font-semibold text-gray-700 mb-2 text-lg">
              Тесты по теме:
            </div>
            <div className="space-y-4">
              {tests.map((test) => (
                  <div
                      key={test.id}
                      className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between border border-gray-200"
                  >
                  <div>
                    <div className="font-semibold text-lg text-gray-900 font-sans">
                      {test.title}
                    </div>
                    <div className="text-gray-500 text-sm">
                      Тип: {test.type}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/test/${test.id}`)}
                    >
                      Пройти тест
                    </Button>
                    {(user?.role === "admin" || user?.role === "teacher") && (
                      <>
                        <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full border-[#3A86FF] text-[#3A86FF]"
                            onClick={() => setOpenQuestionsEditor(test.id)}
                        >
                          Редактировать вопросы
                        </Button>
                        {editMode && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                onClick={async () => {
                                  await testApi.deleteTest(test.id);
                                  setTests((prev) =>
                                      prev.filter((t) => t.id !== test.id),
                                  );
                                }}
                                title="Удалить тест"
                            >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <footer className="bg-slate-900 text-white py-6 mt-auto">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-slate-400 mb-4">
            © 2025. Все права защищены.
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <a
              href="/privacy"
              className="text-purple-300 hover:text-purple-200 transition-colors"
            >
              Политика конфиденциальности
            </a>
            <a
              href="/terms"
              className="text-purple-300 hover:text-purple-200 transition-colors"
            >
              Условия использования
            </a>
            <a
              href="/contact"
              className="text-purple-300 hover:text-purple-200 transition-colors"
            >
              Контакты
            </a>
          </div>
        </div>
      </footer>
      {/* Модальное окно для создания раздела */}
      <Dialog open={openSection} onOpenChange={setOpenSection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить раздел</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSection} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Название раздела
              </label>
              <input
                className="border rounded px-2 py-1 w-full"
                value={sectionForm.title}
                onChange={(e) =>
                    setSectionForm((f) => ({...f, title: e.target.value}))
                }
                placeholder="Название раздела"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Описание</label>
              <textarea
                className="border rounded px-2 py-1 w-full"
                value={sectionForm.description}
                onChange={(e) =>
                    setSectionForm((f) => ({...f, description: e.target.value}))
                }
                placeholder="Описание раздела"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={creatingSection}>
                Создать
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Отмена
                </Button>
              </DialogClose>
            </DialogFooter>
            {errorSection && (
                <div className="text-red-500 text-sm mt-2">{errorSection}</div>
            )}
          </form>
        </DialogContent>
      </Dialog>
      {/* Модалка подтверждения удаления раздела */}
      <AlertDialog
          open={sectionToDelete !== null}
          onOpenChange={(open) => !open && setSectionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить раздел?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот раздел? Это действие
              необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSectionToDelete(null)}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
                onClick={async () => {
                  if (sectionToDelete !== null) {
                    await handleDeleteSection(sectionToDelete);
                    setSectionToDelete(null);
                  }
                }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Dialog for editing section */}
      <Dialog open={!!editSection} onOpenChange={(open) => !open && setEditSection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать раздел</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSection} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Название раздела</label>
              <input
                className="border rounded px-2 py-1 w-full"
                value={editSectionForm.title}
                onChange={(e) => setEditSectionForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Название раздела"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Описание</label>
              <textarea
                className="border rounded px-2 py-1 w-full"
                value={editSectionForm.description}
                onChange={(e) => setEditSectionForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Описание раздела"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={editingSection}>Сохранить</Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">Отмена</Button>
              </DialogClose>
            </DialogFooter>
            {errorEditSection && <div className="text-red-500 text-sm mt-2">{errorEditSection}</div>}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopicPage;
