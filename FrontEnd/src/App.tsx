import React from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TopicSection from "./pages/TopicSection";
import Login from "./pages/Login";
import { AdminPanel } from "./pages/AdminPanel";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Topics from "./pages/Topics";
import { TopicProvider } from "./context/TopicContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import TeacherDashboard from "./pages/TeacherDashboard";
import GroupManagement from "./pages/GroupManagement";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'teacher')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <TopicProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/topics"
                element={
                  <ProtectedRoute>
                    <Topics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/section/:sectionId"
                element={
                  <ProtectedRoute>
                    <TopicSection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                }
              />
              <Route
                path="/teacher"
                element={
                  <AdminRoute>
                    <TeacherDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/teacher/group/:groupId"
                element={
                  <AdminRoute>
                    <GroupManagement />
                  </AdminRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TopicProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;