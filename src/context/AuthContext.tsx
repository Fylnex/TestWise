import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/services/api";

interface User {
  id: string;
  username: string;
  role: "admin" | "student";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    
    if (savedUser && savedToken) {
      // Проверяем валидность токена
      api.getCurrentUser(savedToken).catch(() => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        return null;
      });
      return JSON.parse(savedUser);
    }
    return null;
  });

  const isAuthenticated = !!user;

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { token, user: userData } = await api.login(username, password);
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", token);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
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