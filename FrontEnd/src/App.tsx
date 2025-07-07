import React from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/main/Index";
import NotFound from "./pages/main/NotFound";
import TopicSection from "./pages/learning/sections/TopicSection";
import Login from "./pages/auth/Login";
import { AdminPanel } from "./pages/admin/dashboard/AdminPanel";
import Profile from "./pages/auth/Profile";
import About from "./pages/info/About";
import About_VM from "./pages/info/About_VM";
import Topics from "./pages/main/Topics";
import { TopicProvider } from "./context/TopicContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import TeacherDashboard from "./pages/admin/teacher/TeacherDashboard";
import GroupManagement from "./pages/admin/teacher/GroupManagement";
import TopicPage from "./pages/learning/topics/TopicPage";
import Settings from "./pages/settings/Settings";
import Privacy from "./pages/info/Privacy";
import Terms from "./pages/info/Terms";
import Contact from "./pages/info/Contact";
import CreateTopic from "./pages/learning/topics/CreateTopic";
import TopicSectionTree from "./pages/learning/topics/TopicSectionTree";
import CreateSubsection from "./pages/learning/sections/CreateSubsection";
import EditSubsection from "./pages/learning/sections/EditSubsection";
import CreateTestForSection from "./pages/learning/tests/CreateTestForSection";
import CreateTest from "./pages/learning/tests/CreateTest";
import EditTest from "./pages/learning/tests/EditTest";
import SectionPdfViewer from "./pages/learning/sections/SectionPdfViewer";
import TestQuestionBuilder from "./pages/learning/tests/TestQuestionBuilder";
import TestViewer from "./components/TestViewer";


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
              <Route path="/about_vm" element={<About_VM />} />
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
                path="/topic/:topicId/section/:sectionId/subsection/create"
                element={
                  <AdminRoute>
                    <CreateSubsection />
                  </AdminRoute>
                }
              />
              <Route
                path="/topic/:topicId/section/:sectionId/subsection/:subsectionId/edit"
                element={
                  <AdminRoute>
                    <EditSubsection />
                  </AdminRoute>
                }
              />
              <Route
                path="/test/create/section/:sectionId"
                element={
                  <ProtectedRoute>
                    <CreateTestForSection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/topic/:topicId/section/:sectionId/test/create"
                element={
                  <AdminRoute>
                    <CreateTestForSection />
                  </AdminRoute>
                }
              />
              <Route
                path="/test/create/topic/:topicId"
                element={
                  <ProtectedRoute>
                    <CreateTestForSection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test/create"
                element={
                  <AdminRoute>
                    <CreateTest />
                  </AdminRoute>
                }
              />
              <Route
                path="/test/:testId"
                element={
                  <ProtectedRoute>
                    <TestViewer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/topic/:topicId/section/:sectionId/test/:testId"
                element={
                  <ProtectedRoute>
                    <TestViewer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/topic/:topicId/test/:testId"
                element={
                  <ProtectedRoute>
                    <TestViewer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test/:testId/edit"
                element={
                  <AdminRoute>
                    <EditTest />
                  </AdminRoute>
                }
              />
              <Route
                path="/topic/:topicId/section/:sectionId/test/:testId/edit"
                element={
                  <AdminRoute>
                    <EditTest />
                  </AdminRoute>
                }
              />
              <Route
                path="/topic/:topicId/test/:testId/edit"
                element={
                  <AdminRoute>
                    <EditTest />
                  </AdminRoute>
                }
              />
              <Route
                path="/section/:sectionId/pdf"
                element={
                  <ProtectedRoute>
                    <SectionPdfViewer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test/:testId/questions"
                element={
                  <AdminRoute>
                    <TestQuestionBuilder />
                  </AdminRoute>
                }
              />
              <Route
                path="/topic/:topicId/section/:sectionId/test/:testId/questions/edit"
                element={
                  <AdminRoute>
                    <TestQuestionBuilder />
                  </AdminRoute>
                }
              />
              <Route
                path="/topic/:topicId/test/:testId/questions/edit"
                element={
                  <AdminRoute>
                    <TestQuestionBuilder />
                  </AdminRoute>
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