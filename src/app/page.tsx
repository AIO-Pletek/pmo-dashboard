'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, FolderKanban } from 'lucide-react';
import { AuthProvider, useAuth } from '@/components/pmo/auth-context';
import { Sidebar } from '@/components/pmo/sidebar';
import { DashboardOverview } from '@/components/pmo/dashboard-overview';
import { CustomerManagement } from '@/components/pmo/customer-management';
import { ProjectManagement } from '@/components/pmo/project-management';
import { ProjectDetail } from '@/components/pmo/project-detail';
import { ReportManagement } from '@/components/pmo/report-management';
import { ExcelUpload } from '@/components/pmo/excel-upload';
import { DivisionPanel } from '@/components/pmo/division-panel';
import { LoginPage } from '@/components/pmo/login-page';
import { TwoFactorPage } from '@/components/pmo/two-factor-page';
import { ForgotPasswordPage } from '@/components/pmo/forgot-password-page';
import { ResetPasswordPage } from '@/components/pmo/reset-password-page';
import { UserManagement } from '@/components/pmo/user-management';
import { ProfilePage } from '@/components/pmo/profile-page';
import { useDivisions } from '@/components/pmo/use-pmo-data';
import type { ViewType, AuthView, LoginResponse } from '@/components/pmo/types';

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg">
          <FolderKanban className="h-8 w-8 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">PMO Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Memuat aplikasi...
          </p>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
      </motion.div>
    </div>
  );
}

function AuthenticatedApp() {
  const { user, isAdmin, logout } = useAuth();
  const { data: divisionsData } = useDivisions();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const divisions = divisionsData?.data || [];

  const navigate = (view: ViewType) => {
    setCurrentView(view);
    if (view !== 'project-detail') {
      setSelectedProjectId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('project-detail');
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardOverview
            onNavigateToProjects={() => navigate('projects')}
            onProjectClick={handleProjectClick}
          />
        );
      case 'customers':
        return <CustomerManagement />;
      case 'projects':
        return <ProjectManagement onProjectClick={handleProjectClick} />;
      case 'project-detail':
        return selectedProjectId ? (
          <ProjectDetail
            projectId={selectedProjectId}
            onBack={() => navigate('projects')}
          />
        ) : null;
      case 'reports':
        return <ReportManagement />;
      case 'upload':
        return <ExcelUpload />;
      case 'divisions':
        return <DivisionPanel onProjectClick={handleProjectClick} />;
      case 'users':
        return isAdmin ? <UserManagement divisions={divisions} /> : null;
      case 'profile':
        return <ProfilePage />;
      default:
        return null;
    }
  };

  if (loggingOut) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={navigate}
        isAdmin={isAdmin}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {renderContent()}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t bg-card px-6 py-3">
          <div className="flex flex-col items-center justify-between gap-1 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} PMO Dashboard. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Project Management Office
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [resetTokenFromUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('reset');
    }
    return null;
  });
  const [dismissedReset, setDismissedReset] = useState(false);

  const resetToken = resetTokenFromUrl && !dismissedReset ? resetTokenFromUrl : null;

  // Loading state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Not authenticated — show auth pages
  if (!user) {
    if (resetToken) {
      return (
        <ResetPasswordPage
          token={resetToken}
          onReset={() => {
            setDismissedReset(true);
            setAuthView('login');
            window.history.replaceState({}, '', '/');
          }}
          onBack={() => setDismissedReset(true)}
        />
      );
    }

    if (authView === '2fa' && tempToken) {
      return (
        <TwoFactorPage
          tempToken={tempToken}
          onVerified={() => {
            setAuthView('login');
            setTempToken(null);
          }}
          onBack={() => {
            setAuthView('login');
            setTempToken(null);
          }}
        />
      );
    }

    if (authView === 'forgot-password') {
      return (
        <ForgotPasswordPage onBack={() => setAuthView('login')} />
      );
    }

    return (
      <LoginPage
        onLogin={(result: LoginResponse) => {
          if (result.requires2FA && result.tempToken) {
            setTempToken(result.tempToken);
            setAuthView('2fa');
          }
          // If login was successful (no 2FA), user is already set by auth context
        }}
        onForgotPassword={() => setAuthView('forgot-password')}
      />
    );
  }

  // Authenticated — show main app
  return <AuthenticatedApp />;
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}