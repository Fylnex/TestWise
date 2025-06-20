// TestWise/FrontEnd/src/context/AuthContext.tsx
// -*- coding: utf-8 -*-
// """Контекст аутентификации для управления состоянием пользователя.
// ~~~~~~~~~~~~~~~~~~~~~~~~
// Предоставляет функционал для входа, выхода, обновления данных пользователя
// и автоматического обновления токена с использованием Refresh Token.
// """

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { authApi } from "@/services/authApi";
import { User } from "@/services/userApi";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserData: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem("token");
      const savedRefreshToken = localStorage.getItem("refresh_token");

      if (savedToken && savedRefreshToken) {
        try {
          console.log("Validating token:", savedToken);
          const userData = await authApi.getCurrentUser();
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
          console.log("User loaded:", userData);
        } catch (error) {
          console.error("Token validation failed:", error);
          if (savedRefreshToken) {
            try {
              const { access_token, refresh_token } =
                await authApi.refreshToken(savedRefreshToken);
              localStorage.setItem("token", access_token);
              if (refresh_token) {
                localStorage.setItem("refresh_token", refresh_token);
              }
              const userData = await authApi.getCurrentUser();
              setUser(userData);
              localStorage.setItem("user", JSON.stringify(userData));
              console.log("Token refreshed, user reloaded:", userData);
            } catch (refreshError) {
              console.error("Refresh token failed:", refreshError);
              localStorage.removeItem("token");
              localStorage.removeItem("refresh_token");
              localStorage.removeItem("user");
              setUser(null);
            }
          } else {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();

    const interval = setInterval(
      async () => {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          try {
            const { access_token, refresh_token } =
              await authApi.refreshToken(refreshToken);
            localStorage.setItem("token", access_token);
            if (refresh_token) {
              localStorage.setItem("refresh_token", refresh_token);
            }
            console.log("Token refreshed automatically");
          } catch (error) {
            console.error("Automatic token refresh failed:", error);
            localStorage.removeItem("token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");
            setUser(null);
          }
        }
      },
      30 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, []);

  const isAuthenticated = !!user;

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    try {
      console.log("Attempting login with API:", { username, password });
      // Шаг 1: Логинимся и получаем токены
      const response = await authApi.login(username, password);
      const { access_token, refresh_token } = response;

      if (access_token && refresh_token) {
        localStorage.setItem("token", access_token);
        localStorage.setItem("refresh_token", refresh_token);
        
        // Шаг 2: Получаем данные пользователя
        const userData = await authApi.getCurrentUser();
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        
        console.log("Login successful, user:", userData);
        return true;
      } else {
        console.error("Login failed: Invalid token response", response);
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    console.log("Logged out");
  };

  const updateUserData = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    console.log("User data updated:", userData);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, logout, updateUserData }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};