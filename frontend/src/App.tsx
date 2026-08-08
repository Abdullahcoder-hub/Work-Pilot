import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';
import { AcceptInvitePage } from './features/auth/AcceptInvitePage';
import { VerifyEmailPage } from './features/auth/VerifyEmailPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { TasksPage } from './features/tasks/TasksPage';
import { TeamPage } from './features/team/TeamPage';
import { PlatformPage } from './features/platform/PlatformPage';
import { ProjectsPage } from './features/projects/ProjectsPage';
import { ProjectDetailPage } from './features/projects/ProjectDetailPage';
import { DepartmentsPage } from './features/departments/DepartmentsPage';
import { NotificationsPage } from './features/notifications/NotificationsPage';
import { ActivityLogsPage } from './features/activity/ActivityLogsPage';
import { CalendarPage } from './features/calendar/CalendarPage';
import { MeetingsPage } from './features/meetings/MeetingsPage';
import { ChatPage } from './features/chat/ChatPage';
import { AttendancePage } from './features/attendance/AttendancePage';
import { LeavePage } from './features/leave/LeavePage';
import { AiAssistantPage } from './features/ai/AiAssistantPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { FilesPage } from './features/files/FilesPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { FullPageSpinner } from './components/ui/Spinner';

function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'super_admin' ? '/platform' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/team" element={<TeamPage />} />

            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/leave" element={<LeavePage />} />
            <Route path="/ai-assistant" element={<AiAssistantPage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            <Route element={<RoleRoute allow={['company_admin', 'team_lead']} />}>
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/activity-logs" element={<ActivityLogsPage />} />
            </Route>

            <Route element={<RoleRoute allow={['super_admin']} />}>
              <Route path="/platform" element={<PlatformPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
