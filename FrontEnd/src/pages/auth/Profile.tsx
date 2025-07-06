import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {progressApi, StudentProgress} from "@/services/progressApi";
import AdminProfile from "./AdminProfile";
import TeacherProfile from "./TeacherProfile";
import StudentProfile from "./StudentProfile";

export default function Profile() {
  const { user, updateUserData } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editLoading, setEditLoading] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState({ full_name: user?.full_name || '', username: user?.username || '' });

  React.useEffect(() => {
    if (user) {
      progressApi
        .getStudentProgress(user.id)
        .then((data) => {
          setProgress(data);
          console.log("Progress loaded:", data);
        })
        .catch((error) => console.error("Failed to load progress:", error))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleEditSave = async () => {
    setEditLoading(true);
    setEditError(null);
    try {
      const updated = await import('@/services/userApi').then(m => m.userApi.updateUser(user.id, { full_name: editForm.full_name, username: editForm.username }));
      updateUserData(updated);
      setEditOpen(false);
    } catch {
      setEditError('Ошибка при сохранении');
    } finally {
      setEditLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-[1000px] mx-auto py-6 px-4">
        <p>Не аутентифицирован</p>
      </div>
    );
  }

  // Рендерим соответствующий компонент в зависимости от роли
  if (user.role === 'admin') {
    return (
      <AdminProfile
        user={user}
        editOpen={editOpen}
        setEditOpen={setEditOpen}
        editLoading={editLoading}
        editError={editError}
        editForm={editForm}
        setEditForm={setEditForm}
        handleEditSave={handleEditSave}
      />
    );
  }

  if (user.role === 'teacher') {
    return (
      <TeacherProfile
        user={user}
        editOpen={editOpen}
        setEditOpen={setEditOpen}
        editLoading={editLoading}
        editError={editError}
        editForm={editForm}
        setEditForm={setEditForm}
        handleEditSave={handleEditSave}
      />
    );
  }

  // STUDENT: по умолчанию
  return (
    <StudentProfile
      user={user}
      progress={progress}
      isLoading={isLoading}
      editOpen={editOpen}
      setEditOpen={setEditOpen}
      editLoading={editLoading}
      editError={editError}
      editForm={editForm}
      setEditForm={setEditForm}
      handleEditSave={handleEditSave}
    />
  );
}
