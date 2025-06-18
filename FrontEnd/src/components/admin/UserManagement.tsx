// TestWise/FrontEnd/src/components/admin/UserManagement.tsx
// -*- coding: utf-8 -*-
// """Компонент управления пользователями.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Предоставляет интерфейс для создания, редактирования, удаления,
// блокировки/разблокировки пользователей, массового управления ролями и статусом,
// а также экспорта данных в CSV. Включает фильтрацию и обработку ошибок.
// """

import React, { useEffect, useState } from "react";
import { userApi, User } from "@/services/userApi";
import { useAuth } from "@/context/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "../../components/ui/date-picker";
import { format } from "date-fns";
import { Ban, Check, Pencil, Plus, Trash } from "lucide-react";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error in UserManagement:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Что-то пошло не так
          </h2>
          <p>
            Произошла ошибка при загрузке компонента управления пользователями.
          </p>
          <Button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4"
          >
            Попробовать снова
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function UserManagement() {
  const { user: currentUser, updateUserData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "student",
    isActive: true,
  });
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    isActive: undefined as boolean | undefined,
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });
  const [bulkRole, setBulkRole] = useState("admin");

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      const response = await userApi.getAllUsers({
        search: filters.search,
        role: filters.role !== "all" ? filters.role : undefined,
        isActive: filters.isActive,
        startDate: filters.startDate
          ? format(filters.startDate, "yyyy-MM-dd")
          : undefined,
        endDate: filters.endDate
          ? format(filters.endDate, "yyyy-MM-dd")
          : undefined,
      });
      setUsers(response);
    } catch (error) {
      toast.error("Ошибка при загрузке пользователей");
    }
  };

  const handleCreateUser = async () => {
    try {
      await userApi.createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        isActive: formData.isActive,
      });
      toast.success("Пользователь успешно создан");
      setIsCreateDialogOpen(false);
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "student",
        isActive: true,
      });
      loadUsers();
    } catch (error) {
      toast.error("Ошибка при создании пользователя");
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const updatedUser = await userApi.updateUser(selectedUser.id, {
        username: formData.username,
        email: formData.email,
        password: formData.password || undefined,
        role: formData.role,
        isActive: formData.isActive,
      });

      if (currentUser?.id === selectedUser.id) {
        updateUserData(updatedUser);
      }

      toast.success("Пользователь успешно обновлен");
      setIsEditDialogOpen(false);
      loadUsers();
    } catch (error) {
      toast.error("Ошибка при обновлении пользователя");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) return;

    try {
      await userApi.deleteUser(userId);
      toast.success("Пользователь успешно удален");
      loadUsers();
    } catch (error) {
      toast.error("Ошибка при удалении пользователя");
    }
  };

  const handleBlockUser = async (userId: number) => {
    try {
      await userApi.updateUser(userId, { isActive: false });
      toast.success("Пользователь заблокирован");
      loadUsers();
    } catch (error) {
      toast.error("Ошибка при блокировке пользователя");
    }
  };

  const handleUnblockUser = async (userId: number) => {
    try {
      await userApi.updateUser(userId, { isActive: true });
      toast.success("Пользователь разблокирован");
      loadUsers();
    } catch (error) {
      toast.error("Ошибка при разблокировке пользователя");
    }
  };

  const handleResetPassword = async (userId: number) => {
    try {
      const result = await userApi.resetPassword(userId);
      toast.success(`Пароль сброшен. Новый пароль: ${result.new_password}`);
    } catch (error) {
      toast.error("Ошибка при сбросе пароля");
    }
  };

  const handleExportUsers = async () => {
    try {
      const blob = await userApi.exportUsers({
        search: filters.search,
        role: filters.role !== "all" ? filters.role : undefined,
        isActive: filters.isActive,
        startDate: filters.startDate
          ? format(filters.startDate, "yyyy-MM-dd")
          : undefined,
        endDate: filters.endDate
          ? format(filters.endDate, "yyyy-MM-dd")
          : undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "users.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Ошибка при экспорте пользователей");
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleBulkUpdateRoles = async (role: string) => {
    if (!selectedUsers.length) return;

    try {
      await userApi.bulkUpdateRoles(selectedUsers, role);
      toast.success("Роли успешно обновлены");
      loadUsers();
    } catch (error) {
      toast.error("Ошибка при обновлении ролей");
    }
  };

  const handleBulkUpdateStatus = async (isActive: boolean) => {
    if (!selectedUsers.length) return;

    try {
      await userApi.bulkUpdateStatus(selectedUsers, isActive);
      toast.success(
        `Пользователи успешно ${isActive ? "разблокированы" : "заблокированы"}`,
      );
      loadUsers();
    } catch (error) {
      toast.error("Ошибка при обновлении статуса пользователей");
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email || "",
      password: "",
      role: user.role,
      isActive: user.isActive,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Управление пользователями
            </h2>
            <p className="text-muted-foreground">
              Создание, редактирование и управление пользователями системы
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportUsers}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Экспорт
            </Button>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать пользователя
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать нового пользователя</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Имя пользователя
                    </label>
                    <Input
                      placeholder="Введите имя пользователя"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      placeholder="Введите email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Пароль</label>
                    <Input
                      type="password"
                      placeholder="Введите пароль"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Роль</label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите роль" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Администратор</SelectItem>
                        <SelectItem value="teacher">Учитель</SelectItem>
                        <SelectItem value="student">Студент</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Статус</label>
                    <Select
                      value={formData.isActive.toString()}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          isActive: value === "true",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Активен</SelectItem>
                        <SelectItem value="false">Заблокирован</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Отмена
                  </Button>
                  <Button onClick={handleCreateUser}>Создать</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg border p-4 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Фильтры</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Поиск</label>
              <Input
                placeholder="Поиск по имени"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Роль</label>
              <Select
                value={filters.role}
                onValueChange={(value) =>
                  setFilters({ ...filters, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Фильтр по роли" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="teacher">Учитель</SelectItem>
                  <SelectItem value="student">Студент</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Статус
              </label>
              <Select
                value={filters.isActive?.toString() || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    isActive:
                      value === "true"
                        ? true
                        : value === "false"
                          ? false
                          : undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="true">Активные</SelectItem>
                  <SelectItem value="false">Заблокированные</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Период
              </label>
              <div className="flex space-x-2">
                <DatePicker
                  selected={filters.startDate}
                  onSelect={(date) =>
                    setFilters({ ...filters, startDate: date })
                  }
                  placeholderText="Дата с"
                />
                <DatePicker
                  selected={filters.endDate}
                  onSelect={(date) => setFilters({ ...filters, endDate: date })}
                  placeholderText="Дата по"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  Выбрано: {selectedUsers.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={bulkRole}
                  onValueChange={(value) => {
                    setBulkRole(value);
                    handleBulkUpdateRoles(value);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Изменить роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Администратор</SelectItem>
                    <SelectItem value="teacher">Учитель</SelectItem>
                    <SelectItem value="student">Студент</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => handleBulkUpdateStatus(true)}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Разблокировать
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBulkUpdateStatus(false)}
                  className="flex items-center gap-2"
                >
                  <Ban className="h-4 w-4" />
                  Заблокировать
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedUsers.length === users.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedUsers(users.map((u) => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Имя пользователя</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead>Последний вход</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email || "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-red-100 text-red-800"
                          : user.role === "teacher"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {user.role === "admin"
                        ? "Администратор"
                        : user.role === "teacher"
                          ? "Учитель"
                          : "Студент"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.isActive ? "Активен" : "Заблокирован"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.createdAt &&
                    !isNaN(new Date(user.createdAt).getTime())
                      ? format(new Date(user.createdAt), "dd.MM.yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {user.lastLogin &&
                    !isNaN(new Date(user.lastLogin).getTime())
                      ? format(new Date(user.lastLogin), "dd.MM.yyyy HH:mm")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {user.isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBlockUser(user.id)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnblockUser(user.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(user.id)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.999 9.561a1 1 0 11-2 0v-1.122a6.001 6.001 0 0111.959 1.561A1 1 0 0114 12a5.001 5.001 0 01-9.999.561V13a1 1 0 11-2 0v-2.439z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Редактировать пользователя</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Имя пользователя</label>
                <Input
                  placeholder="Введите имя пользователя"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="Введите email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Новый пароль</label>
                <Input
                  type="password"
                  placeholder="Оставьте пустым, чтобы сохранить текущий"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Роль</label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Администратор</SelectItem>
                    <SelectItem value="teacher">Учитель</SelectItem>
                    <SelectItem value="student">Студент</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Статус</label>
                <Select
                  value={formData.isActive.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      isActive: value === "true",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Активен</SelectItem>
                    <SelectItem value="false">Заблокирован</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button onClick={handleUpdateUser}>Сохранить</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
}
