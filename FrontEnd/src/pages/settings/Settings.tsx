import React, { useState } from "react";
import LayoutWithoutFooter from "@/components/LayoutWithoutFooter";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Save, 
  Eye, 
  EyeOff,
  Lock,
  Mail,
  Smartphone
} from "lucide-react";

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Состояние для настроек профиля
  const [profileSettings, setProfileSettings] = useState({
    fullName: user?.full_name || "",
    email: "",
    phone: "",
    bio: "",
    language: "ru",
    timezone: "Europe/Moscow"
  });

  // Состояние для уведомлений
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    testResults: true,
    newTopics: true,
    systemUpdates: false,
    marketingEmails: false
  });

  // Состояние для приватности
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showProgress: true,
    showEmail: false,
    allowMessages: true,
    dataCollection: true
  });

  // Состояние для внешнего вида
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "system",
    fontSize: "medium",
    compactMode: false,
    animations: true
  });

  // Состояние для безопасности
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordChangeRequired: false
  });

  const handleProfileSave = () => {
    // Здесь будет логика сохранения настроек профиля
    console.log("Сохранение настроек профиля:", profileSettings);
  };

  const handleNotificationSave = () => {
    // Здесь будет логика сохранения настроек уведомлений
    console.log("Сохранение настроек уведомлений:", notificationSettings);
  };

  const handlePrivacySave = () => {
    // Здесь будет логика сохранения настроек приватности
    console.log("Сохранение настроек приватности:", privacySettings);
  };

  const handleAppearanceSave = () => {
    // Здесь будет логика сохранения настроек внешнего вида
    console.log("Сохранение настроек внешнего вида:", appearanceSettings);
  };

  const handleSecuritySave = () => {
    // Здесь будет логика сохранения настроек безопасности
    console.log("Сохранение настроек безопасности:", securitySettings);
  };

  return (
    <LayoutWithoutFooter>
      <div className="max-w-[1000px] mx-auto py-6 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Настройки</h1>
          <p className="text-slate-600">Управляйте своими настройками и предпочтениями</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Профиль</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Уведомления</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Приватность</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Внешний вид</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Безопасность</span>
            </TabsTrigger>
          </TabsList>

          {/* Профиль */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Основная информация
                </CardTitle>
                <CardDescription>
                  Обновите свои личные данные и контактную информацию
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Полное имя</Label>
                    <Input
                      id="fullName"
                      value={profileSettings.fullName}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Введите ваше полное имя"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileSettings.email}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      value={profileSettings.phone}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Язык</Label>
                    <Select value={profileSettings.language} onValueChange={(value) => setProfileSettings(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">О себе</Label>
                  <Input
                    id="bio"
                    value={profileSettings.bio}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Расскажите немного о себе..."
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleProfileSave} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Сохранить изменения
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Уведомления */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Настройки уведомлений
                </CardTitle>
                <CardDescription>
                  Выберите, какие уведомления вы хотите получать
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Email уведомления</Label>
                      <p className="text-sm text-slate-500">Получать уведомления на email</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Push уведомления</Label>
                      <p className="text-sm text-slate-500">Получать уведомления в браузере</p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Результаты тестов</Label>
                      <p className="text-sm text-slate-500">Уведомления о результатах тестирования</p>
                    </div>
                    <Switch
                      checked={notificationSettings.testResults}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, testResults: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Новые темы</Label>
                      <p className="text-sm text-slate-500">Уведомления о новых темах для изучения</p>
                    </div>
                    <Switch
                      checked={notificationSettings.newTopics}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, newTopics: checked }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleNotificationSave} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Сохранить настройки
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Приватность */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Настройки приватности
                </CardTitle>
                <CardDescription>
                  Управляйте тем, какую информацию о себе вы показываете другим
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Видимость профиля</Label>
                    <Select value={privacySettings.profileVisibility} onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, profileVisibility: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Публичный</SelectItem>
                        <SelectItem value="friends">Только друзья</SelectItem>
                        <SelectItem value="private">Приватный</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Показывать прогресс</Label>
                      <p className="text-sm text-slate-500">Разрешить другим видеть ваш прогресс обучения</p>
                    </div>
                    <Switch
                      checked={privacySettings.showProgress}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showProgress: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Показывать email</Label>
                      <p className="text-sm text-slate-500">Разрешить другим видеть ваш email</p>
                    </div>
                    <Switch
                      checked={privacySettings.showEmail}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showEmail: checked }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handlePrivacySave} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Сохранить настройки
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Внешний вид */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Настройки внешнего вида
                </CardTitle>
                <CardDescription>
                  Настройте внешний вид приложения под свои предпочтения
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Тема</Label>
                    <Select value={appearanceSettings.theme} onValueChange={(value) => setAppearanceSettings(prev => ({ ...prev, theme: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Светлая</SelectItem>
                        <SelectItem value="dark">Темная</SelectItem>
                        <SelectItem value="system">Системная</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Размер шрифта</Label>
                    <Select value={appearanceSettings.fontSize} onValueChange={(value) => setAppearanceSettings(prev => ({ ...prev, fontSize: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Маленький</SelectItem>
                        <SelectItem value="medium">Средний</SelectItem>
                        <SelectItem value="large">Большой</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Компактный режим</Label>
                      <p className="text-sm text-slate-500">Уменьшить отступы и размеры элементов</p>
                    </div>
                    <Switch
                      checked={appearanceSettings.compactMode}
                      onCheckedChange={(checked) => setAppearanceSettings(prev => ({ ...prev, compactMode: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Анимации</Label>
                      <p className="text-sm text-slate-500">Показывать анимации и переходы</p>
                    </div>
                    <Switch
                      checked={appearanceSettings.animations}
                      onCheckedChange={(checked) => setAppearanceSettings(prev => ({ ...prev, animations: checked }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleAppearanceSave} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Сохранить настройки
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Безопасность */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Настройки безопасности
                </CardTitle>
                <CardDescription>
                  Управляйте безопасностью вашего аккаунта
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Двухфакторная аутентификация</Label>
                      <p className="text-sm text-slate-500">Дополнительный уровень защиты аккаунта</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorAuth}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Таймаут сессии (минуты)</Label>
                    <Select value={securitySettings.sessionTimeout.toString()} onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 минут</SelectItem>
                        <SelectItem value="30">30 минут</SelectItem>
                        <SelectItem value="60">1 час</SelectItem>
                        <SelectItem value="120">2 часа</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Требовать смену пароля</Label>
                      <p className="text-sm text-slate-500">Принудительно сменить пароль при следующем входе</p>
                    </div>
                    <Switch
                      checked={securitySettings.passwordChangeRequired}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, passwordChangeRequired: checked }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSecuritySave} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Сохранить настройки
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutWithoutFooter>
  );
};

export default Settings; 