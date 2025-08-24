import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Users, UserPlus, GraduationCap, X, CheckCircle, AlertCircle } from 'lucide-react';
import { userApi, User } from '@/services/userApi';
import { groupApi, Group } from '@/services/groupApi';

interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentsCreated: () => void;
  preselectedGroupId?: number;
}

interface StudentFormData {
  username: string;
  full_name: string;
  patronymic: string;
  password: string;
  group_id?: number;
}

interface BulkStudentData {
  students: StudentFormData[];
  assignToGroup: boolean;
  group_id?: number;
}

const CreateStudentModal: React.FC<CreateStudentModalProps> = ({
  isOpen,
  onClose,
  onStudentsCreated,
  preselectedGroupId
}) => {
  const [activeTab, setActiveTab] = useState('single');
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Одиночное создание
  const [singleStudent, setSingleStudent] = useState<StudentFormData>({
    username: '',
    full_name: '',
    patronymic: '',
    password: '',
    group_id: preselectedGroupId
  });

  // Массовое создание
  const [bulkData, setBulkData] = useState<BulkStudentData>({
    students: [],
    assignToGroup: false,
    group_id: preselectedGroupId
  });

  // CSV импорт
  const [csvData, setCsvData] = useState<string>('');
  const [csvPreview, setCsvPreview] = useState<StudentFormData[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
      if (preselectedGroupId) {
        setSingleStudent(prev => ({ ...prev, group_id: preselectedGroupId }));
        setBulkData(prev => ({ ...prev, group_id: preselectedGroupId }));
      }
    }
  }, [isOpen, preselectedGroupId]);

  const loadGroups = async () => {
    try {
      const response = await groupApi.getGroups();
      setGroups(response.filter(group => !group.is_archived));
    } catch (error) {
      toast.error('Ошибка при загрузке групп');
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const validateStudentData = (student: StudentFormData): string[] => {
    const errors: string[] = [];
    if (!student.username.trim()) errors.push('Имя пользователя обязательно');
    if (!student.full_name.trim()) errors.push('Полное имя обязательно');
    if (!student.password.trim()) errors.push('Пароль обязателен');
    if (student.username.length < 3) errors.push('Имя пользователя должно содержать минимум 3 символа');
    if (student.password.length < 6) errors.push('Пароль должен содержать минимум 6 символов');
    return errors;
  };

  const handleCreateSingleStudent = async () => {
    const errors = validateStudentData(singleStudent);
    if (errors.length > 0) {
      toast.error(`Ошибки валидации: ${errors.join(', ')}`);
      return;
    }

    setIsLoading(true);
    try {
      const newStudent = await userApi.createUser({
        username: singleStudent.username,
        full_name: singleStudent.full_name,
        password: singleStudent.password,
        role: 'student',
        is_active: true
      });

      // Если выбрана группа, добавляем студента в неё
      if (singleStudent.group_id) {
        try {
          await groupApi.addGroupStudents(singleStudent.group_id, [newStudent.id]);
          toast.success(`Студент ${singleStudent.full_name} создан и добавлен в группу`);
        } catch (groupError) {
          toast.success(`Студент ${singleStudent.full_name} создан, но не удалось добавить в группу`);
        }
      } else {
        toast.success(`Студент ${singleStudent.full_name} успешно создан`);
      }

      // Сброс формы
      setSingleStudent({
        username: '',
        full_name: '',
        patronymic: '',
        password: '',
        group_id: preselectedGroupId
      });

      onStudentsCreated();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при создании студента');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBulkStudent = () => {
    const newStudent: StudentFormData = {
      username: '',
      full_name: '',
      patronymic: '',
      password: generatePassword(),
      group_id: bulkData.group_id
    };
    setBulkData(prev => ({
      ...prev,
      students: [...prev.students, newStudent]
    }));
  };

  const handleRemoveBulkStudent = (index: number) => {
    setBulkData(prev => ({
      ...prev,
      students: prev.students.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateBulkStudent = (index: number, field: keyof StudentFormData, value: string | number) => {
    setBulkData(prev => ({
      ...prev,
      students: prev.students.map((student, i) => 
        i === index ? { ...student, [field]: value } : student
      )
    }));
  };

  const handleCreateBulkStudents = async () => {
    if (bulkData.students.length === 0) {
      toast.error('Добавьте хотя бы одного студента');
      return;
    }

    const allErrors: { index: number; errors: string[] }[] = [];
    bulkData.students.forEach((student, index) => {
      const errors = validateStudentData(student);
      if (errors.length > 0) {
        allErrors.push({ index, errors });
      }
    });

    if (allErrors.length > 0) {
      const errorMessage = allErrors.map(({ index, errors }) => 
        `Студент ${index + 1}: ${errors.join(', ')}`
      ).join('\n');
      toast.error(`Ошибки валидации:\n${errorMessage}`);
      return;
    }

    setIsLoading(true);
    try {
      const createdStudents: User[] = [];
      
      // Создаём всех студентов
      for (const student of bulkData.students) {
        try {
          const newStudent = await userApi.createUser({
            username: student.username,
            full_name: student.full_name,
            password: student.password,
            role: 'student',
            is_active: true
          });
          createdStudents.push(newStudent);
        } catch (error: any) {
          toast.error(`Ошибка при создании студента ${student.full_name}: ${error.response?.data?.detail || 'Неизвестная ошибка'}`);
        }
      }

      // Если нужно добавить в группу
      if (bulkData.assignToGroup && bulkData.group_id && createdStudents.length > 0) {
        try {
          const studentIds = createdStudents.map(s => s.id);
          await groupApi.addGroupStudents(bulkData.group_id, studentIds);
          toast.success(`${createdStudents.length} студентов создано и добавлено в группу`);
        } catch (error) {
          toast.success(`${createdStudents.length} студентов создано, но не удалось добавить в группу`);
        }
      } else {
        toast.success(`${createdStudents.length} студентов успешно создано`);
      }

      // Сброс формы
      setBulkData({
        students: [],
        assignToGroup: false,
        group_id: preselectedGroupId
      });

      onStudentsCreated();
    } catch (error) {
      toast.error('Ошибка при массовом создании студентов');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvImport = () => {
    if (!csvData.trim()) {
      toast.error('Введите данные CSV');
      return;
    }

    try {
      const lines = csvData.trim().split('\n');
      const students: StudentFormData[] = [];

      for (const line of lines) {
        const [username, full_name, patronymic = '', password = generatePassword()] = line.split(',').map(s => s.trim());
        
        if (username && full_name) {
          students.push({
            username,
            full_name,
            patronymic,
            password,
            group_id: bulkData.group_id
          });
        }
      }

      if (students.length === 0) {
        toast.error('Не удалось распарсить данные CSV');
        return;
      }

      setCsvPreview(students);
      setBulkData(prev => ({
        ...prev,
        students: [...prev.students, ...students]
      }));
      
      toast.success(`Добавлено ${students.length} студентов из CSV`);
      setCsvData('');
    } catch (error) {
      toast.error('Ошибка при обработке CSV данных');
    }
  };

  const handleClose = () => {
    setSingleStudent({
      username: '',
      full_name: '',
      patronymic: '',
      password: '',
      group_id: preselectedGroupId
    });
    setBulkData({
      students: [],
      assignToGroup: false,
      group_id: preselectedGroupId
    });
    setCsvData('');
    setCsvPreview([]);
    setActiveTab('single');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 rounded-2xl bg-white shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-800 tracking-tight">
                Создание студентов
              </DialogTitle>
              <p className="text-gray-600 mt-2">
                Создайте новых пользователей-студентов и назначьте их в группы
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Одиночное создание
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Массовое создание
              </TabsTrigger>
              <TabsTrigger value="csv" className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                CSV импорт
              </TabsTrigger>
            </TabsList>

            {/* Одиночное создание */}
            <TabsContent value="single" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-green-600" />
                    Создать одного студента
                  </CardTitle>
                  <CardDescription>
                    Заполните форму для создания нового студента
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Имя пользователя *</Label>
                      <Input
                        id="username"
                        placeholder="student123"
                        value={singleStudent.username}
                        onChange={(e) => setSingleStudent(prev => ({ ...prev, username: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Пароль *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="password"
                          type="password"
                          placeholder="Минимум 6 символов"
                          value={singleStudent.password}
                          onChange={(e) => setSingleStudent(prev => ({ ...prev, password: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSingleStudent(prev => ({ ...prev, password: generatePassword() }))}
                        >
                          Сгенерировать
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Полное имя *</Label>
                      <Input
                        id="full_name"
                        placeholder="Иванов Иван"
                        value={singleStudent.full_name}
                        onChange={(e) => setSingleStudent(prev => ({ ...prev, full_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patronymic">Отчество</Label>
                      <Input
                        id="patronymic"
                        placeholder="Иванович"
                        value={singleStudent.patronymic}
                        onChange={(e) => setSingleStudent(prev => ({ ...prev, patronymic: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="group">Группа</Label>
                    <Select
                      value={singleStudent.group_id?.toString() || ''}
                      onValueChange={(value) => setSingleStudent(prev => ({ 
                        ...prev, 
                        group_id: value ? parseInt(value) : undefined 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите группу (необязательно)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Без группы</SelectItem>
                        {groups.map(group => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.name} ({group.start_year}-{group.end_year})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={handleClose}>
                      Отмена
                    </Button>
                    <Button 
                      onClick={handleCreateSingleStudent}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? 'Создание...' : 'Создать студента'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Массовое создание */}
            <TabsContent value="bulk" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Массовое создание студентов
                  </CardTitle>
                  <CardDescription>
                    Создайте несколько студентов одновременно
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="assignToGroup"
                        checked={bulkData.assignToGroup}
                        onCheckedChange={(checked) => setBulkData(prev => ({ 
                          ...prev, 
                          assignToGroup: checked as boolean 
                        }))}
                      />
                      <Label htmlFor="assignToGroup">Назначить всех в группу</Label>
                    </div>
                    <Button
                      onClick={handleAddBulkStudent}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Добавить студента
                    </Button>
                  </div>

                  {bulkData.assignToGroup && (
                    <div className="space-y-2">
                      <Label htmlFor="bulkGroup">Выберите группу</Label>
                      <Select
                        value={bulkData.group_id?.toString() || ''}
                        onValueChange={(value) => setBulkData(prev => ({ 
                          ...prev, 
                          group_id: value ? parseInt(value) : undefined 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите группу" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map(group => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              {group.name} ({group.start_year}-{group.end_year})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {bulkData.students.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Студенты для создания ({bulkData.students.length})</h4>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          Пароли генерируются автоматически
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {bulkData.students.map((student, index) => (
                          <div key={index} className="p-3 border rounded-lg bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700">
                                Студент {index + 1}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveBulkStudent(index)}
                                className="text-red-500 hover:text-red-600 h-6 w-6 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Имя пользователя</Label>
                                <Input
                                  placeholder="student123"
                                  value={student.username}
                                  onChange={(e) => handleUpdateBulkStudent(index, 'username', e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Полное имя</Label>
                                <Input
                                  placeholder="Иванов Иван"
                                  value={student.full_name}
                                  onChange={(e) => handleUpdateBulkStudent(index, 'full_name', e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Отчество</Label>
                                <Input
                                  placeholder="Иванович"
                                  value={student.patronymic}
                                  onChange={(e) => handleUpdateBulkStudent(index, 'patronymic', e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Пароль</Label>
                                <div className="flex gap-1">
                                  <Input
                                    placeholder="Автогенерация"
                                    value={student.password}
                                    onChange={(e) => handleUpdateBulkStudent(index, 'password', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateBulkStudent(index, 'password', generatePassword())}
                                    className="h-8 px-2"
                                  >
                                    🔄
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {bulkData.students.length > 0 && (
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button variant="outline" onClick={handleClose}>
                        Отмена
                      </Button>
                      <Button 
                        onClick={handleCreateBulkStudents}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? 'Создание...' : `Создать ${bulkData.students.length} студентов`}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* CSV импорт */}
            <TabsContent value="csv" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-purple-600" />
                    Импорт студентов из CSV
                  </CardTitle>
                  <CardDescription>
                    Загрузите список студентов в формате CSV
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="csvData">CSV данные</Label>
                    <textarea
                      id="csvData"
                      placeholder="username,full_name,patronymic,password&#10;student1,Иванов Иван,Иванович,pass123&#10;student2,Петров Петр,Петрович,pass456"
                      value={csvData}
                      onChange={(e) => setCsvData(e.target.value)}
                      className="w-full h-32 p-3 border rounded-lg resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Формат: username,full_name,patronymic,password (отчество и пароль необязательны)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="csvAssignToGroup"
                      checked={bulkData.assignToGroup}
                      onCheckedChange={(checked) => setBulkData(prev => ({ 
                        ...prev, 
                        assignToGroup: checked as boolean 
                      }))}
                    />
                    <Label htmlFor="csvAssignToGroup">Назначить всех в группу</Label>
                  </div>

                  {bulkData.assignToGroup && (
                    <div className="space-y-2">
                      <Label htmlFor="csvGroup">Выберите группу</Label>
                      <Select
                        value={bulkData.group_id?.toString() || ''}
                        onValueChange={(value) => setBulkData(prev => ({ 
                          ...prev, 
                          group_id: value ? parseInt(value) : undefined 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите группу" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map(group => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              {group.name} ({group.start_year}-{group.end_year})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleCsvImport}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Предварительный просмотр
                    </Button>
                    <Button
                      onClick={handleCreateBulkStudents}
                      disabled={bulkData.students.length === 0 || isLoading}
                      className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                    >
                      {isLoading ? 'Создание...' : `Создать ${bulkData.students.length} студентов`}
                    </Button>
                  </div>

                  {csvPreview.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Предварительный просмотр ({csvPreview.length} студентов)
                        </span>
                      </div>
                      <div className="text-xs text-blue-700 space-y-1">
                        {csvPreview.map((student, index) => (
                          <div key={index} className="flex gap-2">
                            <span className="font-medium">{student.username}</span>
                            <span>—</span>
                            <span>{student.full_name}</span>
                            {student.patronymic && (
                              <>
                                <span>—</span>
                                <span>{student.patronymic}</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStudentModal;
