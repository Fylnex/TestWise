import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Activity, CheckCircle, XCircle, AlertTriangle, Search, Filter, Download } from "lucide-react";
import { dashboardApi, SystemLog } from '@/services/dashboardApi';

export function SystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const logsData = await dashboardApi.getSystemLogs();
      setLogs(logsData);
    } catch (error) {
      console.error('Ошибка загрузки логов:', error);
      setError('Ошибка загрузки логов. Попробуйте обновить страницу.');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'delete': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'update': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'archive': return <FileText className="h-4 w-4 text-orange-500" />;
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'login': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'logout': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'create': return 'Создание';
      case 'delete': return 'Удаление';
      case 'update': return 'Обновление';
      case 'archive': return 'Архивация';
      case 'complete': return 'Завершение';
      case 'login': return 'Вход';
      case 'logout': return 'Выход';
      default: return type;
    }
  };

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'create':
      case 'complete':
      case 'login': return 'default';
      case 'delete':
      case 'logout': return 'destructive';
      case 'update': return 'secondary';
      case 'archive': return 'outline';
      default: return 'outline';
    }
  };

  // Фильтрация логов
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesUser = filterUser === 'all' || log.user === filterUser;

    return matchesSearch && matchesType && matchesUser;
  });

  // Получаем уникальных пользователей для фильтра
  const uniqueUsers = Array.from(new Set(logs.map(log => log.user)));

  // Получаем уникальные типы действий для фильтра
  const uniqueTypes = Array.from(new Set(logs.map(log => log.type)));

  const exportLogs = () => {
    const csvContent = [
      ['Дата', 'Пользователь', 'Действие', 'Объект', 'Тип'],
      ...filteredLogs.map(log => [
        log.date,
        log.user,
        log.action,
        log.target,
        getTypeLabel(log.type)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загрузка логов...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-600 mb-2">Ошибка загрузки</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadLogs}>
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и статистика */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Системные логи</h2>
          <p className="text-muted-foreground">
            Всего записей: {logs.length} | Отфильтровано: {filteredLogs.length}
          </p>
        </div>
        <Button onClick={exportLogs} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Экспорт CSV
        </Button>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по пользователю, действию или объекту..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Тип действия</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Все типы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {getTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Пользователь</label>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Все пользователи" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все пользователи</SelectItem>
                  {uniqueUsers.map(user => (
                    <SelectItem key={user} value={user}>
                      {user}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Логи */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Логи системы
          </CardTitle>
          <CardDescription>
            Последние действия пользователей в системе
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {logs.length === 0 ? 'Нет записей логов' : 'Нет записей, соответствующих фильтрам'}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredLogs.map(log => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                  {getActionIcon(log.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-blue-800 truncate">
                        {log.user}
                      </p>
                      <span className="text-sm text-muted-foreground">—</span>
                      <p className="text-sm truncate">
                        {log.action}
                      </p>
                      <span className="text-sm text-muted-foreground">—</span>
                      <p className="text-sm font-medium truncate">
                        {log.target}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {log.date}
                    </p>
                  </div>
                  <Badge variant={getTypeVariant(log.type)} className="text-xs shrink-0">
                    {getTypeLabel(log.type)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 