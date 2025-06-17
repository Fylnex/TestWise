import React, { useState, useEffect } from 'react';
import { userApi, User } from '../../services/api';
import { useAuth } from '@/context/AuthContext';
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
import { Pencil, Ban, Check, Trash, Plus } from "lucide-react";

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
    console.error('Error in UserManagement:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Что-то пошло не так</h2>
          <p>Произошла ошибка при загрузке компонента управления пользователями.</p>
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
    username: '',
    password: '',
    role: 'student',
  });
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    isActive: undefined as boolean | undefined,
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });
  const [bulkRole, setBulkRole] = useState('admin');

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      const response = await userApi.getAllUsers();
      let filteredUsers = response;

      if (filters.search) {
        filteredUsers = filteredUsers.filter(user =>
          user.username.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      if (filters.role !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === filters.role);
      }

      if (filters.isActive !== undefined) {
        filteredUsers = filteredUsers.filter(user => user.isActive === filters.isActive);
      }

      if (filters.startDate && !isNaN(filters.startDate.getTime())) {
        filteredUsers = filteredUsers.filter(user => {
          const userDate = new Date(user.createdAt);
          return !isNaN(userDate.getTime()) && userDate >= filters.startDate!;
        });
      }

      if (filters.endDate && !isNaN(filters.endDate.getTime())) {
        filteredUsers = filteredUsers.filter(user => {
          const userDate = new Date(user.createdAt);
          return !isNaN(userDate.getTime()) && userDate <= filters.endDate!;
        });
      }

      setUsers(filteredUsers);
    } catch (error) {
      toast.error('Ошибка при загрузке пользователей');
    }
  };

  const handleCreateUser = async () => {
    try {
      await userApi.createUser(formData);
      toast.success('Пользователь успешно создан');
      setIsCreateDialogOpen(false);
      setFormData({ username: '', password: '', role: 'student' });
      loadUsers();
    } catch (error) {
      toast.error('Ошибка при создании пользователя');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const updatedUser = await userApi.updateUser(selectedUser.id, {
        username: formData.username,
        password: formData.password || undefined,
        role: formData.role,
      });

      if (currentUser?.id === selectedUser.id) {
        updateUserData(updatedUser);
      }

      toast.success('Пользователь успешно обновлен');
      setIsEditDialogOpen(false);
      loadUsers();
    } catch (error) {
      toast.error('Ошибка при обновлении пользователя');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;

    try {
      await userApi.deleteUser(userId);
      toast.success('Пользователь успешно удален');
      loadUsers();
    } catch (error) {
      toast.error('Ошибка при удалении пользователя');
    }
  };

  const handleBlockUser = async (userId: number) => {
    try {
      await userApi.updateUser(userId, { isActive: false });
      toast.success('Пользователь заблокирован');
      loadUsers();
    } catch (error) {
      toast.error('Ошибка при блокировке пользователя');
    }
  };

  const handleUnblockUser = async (userId: number) => {
    try {
      await userApi.updateUser(userId, { isActive: true });
      toast.success('Пользователь разблокирован');
      loadUsers();
    } catch (error) {
      toast.error('Ошибка при разблокировке пользователя');
    }
  };

  const handleResetPassword = async (userId: number) => {
    try {
      await userApi.resetPassword(userId);
      toast.success('Пароль успешно сброшен');
    } catch (error) {
      toast.error('Ошибка при сбросе пароля');
    }
  };

  const handleExportUsers = async () => {
    try {
      const blob = await userApi.exportUsers();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Ошибка при экспорте пользователей');
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkUpdateRoles = async (role: string) => {
    if (!selectedUsers.length) return;

    try {
      await Promise.all(
        selectedUsers.map(userId =>
          userApi.updateUser(userId, { role })
        )
      );
      toast.success('Роли успешно обновлены');
      loadUsers();
    } catch (error) {
      toast.error('Ошибка при обновлении ролей');
    }
  };

  const handleBulkUpdateStatus = async (isActive: boolean) => {
    if (!selectedUsers.length) return;

    try {
      await Promise.all(
        selectedUsers.map(userId =>
          userApi.updateUser(userId, { isActive })
        )
      );
      toast.success(`Пользователи успешно ${isActive ? 'разблокированы' : 'заблокированы'}`);
      loadUsers();
    } catch (error) {
      toast.error('Ошибка при обновлении статуса пользователей');
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Управление пользователями</h2>
            <p className="text-muted-foreground">
              Создание, редактирование и управление пользователями системы
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                  <label className="text-sm font-medium">Имя пользователя</label>
                  <Input
                    placeholder="Введите имя пользователя"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Пароль</label>
                  <Input
                    type="password"
                    placeholder="Введите пароль"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Роль</label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
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
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleCreateUser}>
                  Создать
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Роль</label>
              <Select
                value={filters.role}
                onValueChange={(value) => setFilters({ ...filters, role: value })}
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
              <label className="text-sm font-medium text-gray-700">Статус</label>
              <Select
                value={filters.isActive?.toString() || "all"}
                onValueChange={(value) => setFilters({ ...filters, isActive: value === 'true' ? true : value === 'false' ? false : undefined })}
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
              <label className="text-sm font-medium text-gray-700">Период</label>
              <div className="flex space-x-2">
                <DatePicker
                  selected={filters.startDate}
                  onSelect={(date) => setFilters({ ...filters, startDate: date })}
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Разблокировать
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleBulkUpdateStatus(false)}
                  className="flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
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
                        setSelectedUsers(users.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Имя пользователя</TableHead>
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
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'admin' ? 'Администратор' :
                       user.role === 'teacher' ? 'Учитель' :
                       'Студент'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Активен' : 'Заблокирован'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.createdAt && !isNaN(new Date(user.createdAt).getTime())
                      ? format(new Date(user.createdAt), 'dd.MM.yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {user.lastLogin && !isNaN(new Date(user.lastLogin).getTime())
                      ? format(new Date(user.lastLogin), 'dd.MM.yyyy HH:mm')
                      : '-'}
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
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Новый пароль</label>
                <Input
                  type="password"
                  placeholder="Оставьте пустым, чтобы сохранить текущий"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Роль</label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
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
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleUpdateUser}>
                Сохранить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
} 