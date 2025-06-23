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
import TopicPage from "./pages/TopicPage";
import Settings from "./pages/Settings";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import CreateTopic from "./pages/CreateTopic";
import TopicSectionTree from "./pages/TopicSectionTree";
import CreateSubsection from "./pages/CreateSubsection";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
                path="/section/tree/:sectionId"
                element={
                  <ProtectedRoute>
                    <TopicSectionTree />
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
                path="/topic/:topicId"
                element={
                  <ProtectedRoute>
                    <TopicPage />
                  </ProtectedRoute>
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
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
              <Route
                path="/topics/create"
                element={
                  <AdminRoute>
                    <CreateTopic />
                  </AdminRoute>
                }
              />
              <Route
                path="/subsection/create/:sectionId"
                element={
                  <ProtectedRoute>
                    <CreateSubsection />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TopicProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;