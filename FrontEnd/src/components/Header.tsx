// TestWise/src/components/Header.tsx

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RotateCcw, LogOut, Settings, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuGroup } from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
    window.location.reload();
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
      <div className="max-w-[1000px] mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Логотип */}
          <Link to="/" className="flex items-center space-x-2 group">
            <img 
              src="/SMTU_Logo.png" 
              alt="СПбГМТУ" 
              className="h-8 w-auto object-contain group-hover:scale-105 transition-all duration-300"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
              ЛайнТест
            </span>
          </Link>
          
          {/* Центральная навигация */}
          <nav className="hidden md:flex space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === '/' 
                  ? 'bg-blue-50 text-blue-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Главная
            </Link>
            <Link
              to="/topics"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname.startsWith('/topics') 
                  ? 'bg-blue-50 text-blue-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Темы
            </Link>
          </nav>

          {/* Правая часть - пользователь */}
          <div className="flex items-center space-x-3">
            {user && (
              <>
                {/* Панели управления */}
                {user.role === 'admin' && (
                  <Link to="/admin">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="hidden sm:flex items-center space-x-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-all duration-200"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Админ панель</span>
                    </Button>
                  </Link>
                )}
                {user.role === 'teacher' && (
                  <Link to="/teacher">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="hidden sm:flex items-center space-x-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-all duration-200"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Панель преподавателя</span>
                    </Button>
                  </Link>
                )}

                {/* Аватар пользователя */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-10 w-10 rounded-full hover:bg-slate-100 transition-all duration-200 p-0"
                    >
                      <Avatar className="h-10 w-10 ring-2 ring-slate-100 hover:ring-blue-200 transition-all duration-200">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                          {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal p-3">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none text-slate-900">{user.full_name}</p>
                        <p className="text-xs leading-none text-slate-500">
                          {user.username}
                        </p>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-red-100 text-red-700' 
                              : user.role === 'teacher' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {user.role === 'admin' ? 'Администратор' : user.role === 'teacher' ? 'Преподаватель' : 'Студент'}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <Link to="/profile">
                        <DropdownMenuItem className="p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                          <User className="mr-3 h-4 w-4 text-slate-500" />
                          <span className="text-slate-700">Профиль</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/settings">
                        <DropdownMenuItem className="p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                          <Settings className="mr-3 h-4 w-4 text-slate-500" />
                          <span className="text-slate-700">Настройки</span>
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem 
                          onSelect={(e) => e.preventDefault()}
                          className="p-3 rounded-lg hover:bg-red-50 cursor-pointer text-red-600 hover:text-red-700"
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          <span>Выйти</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-slate-900">Выйти из аккаунта?</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-600">
                            Вы уверены, что хотите выйти из своего аккаунта?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-slate-200 hover:bg-slate-50">Отмена</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Выйти
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
