import React from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import Header from '@/components/Header';
import { useTestEditor } from '@/hooks/useTestEditor';
import TestForm from '@/components/tests/TestForm';
import TestInfoCard from '@/components/tests/TestInfoCard';
import QuestionEditor from '@/components/questions/QuestionEditor';

const TestEditorRefactored: React.FC = () => {
  const { topicId, sectionId } = useParams();
  const {
    test,
    loading,
    saving,
    error,
    formData,
    setFormData,
    questions,
    setQuestions,
    editingQuestion,
    setEditingQuestion,
    isEditing,
    handleSave,
  } = useTestEditor();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => {
              if (topicId && sectionId) {
                window.history.back();
              } else if (topicId) {
                window.history.back();
              } else {
                window.history.back();
              }
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
          
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Save className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditing ? 'Редактирование теста' : 'Создание нового теста'}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-gray-600">
                {isEditing ? 'Измените параметры и вопросы теста' : 'Создайте новый тест с вопросами'}
              </p>
            </div>
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - Форма теста */}
          <div className="lg:col-span-2 space-y-6">
            {/* Форма теста */}
            <TestForm
              formData={formData}
              onFormDataChange={setFormData}
              isEditing={isEditing}
            />

            {/* Редактор вопросов */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Конструктор вопросов</h3>
                <p className="text-muted-foreground text-sm">
                  Здесь вы можете добавлять, редактировать и удалять вопросы теста. 
                  Для каждого вопроса выберите тип, варианты ответа и правильный ответ. 
                  Вопросы появятся в тесте в том порядке, в котором вы их добавите.
                </p>
              </div>
              
                             <QuestionEditor
                 questions={questions}
                 onQuestionsChange={setQuestions}
                 isViewMode={false}
                 showHints={formData.type === 'hinted'}
               />
            </div>
          </div>

                     {/* Правая колонка - Информация о тесте */}
           <div className="space-y-6">
             {test && !isEditing && <TestInfoCard test={test} />}
            
            {/* Кнопка сохранения */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full"
                size="lg"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? 'Обновить тест' : 'Создать тест'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEditorRefactored;
